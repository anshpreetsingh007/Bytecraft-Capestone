#!/usr/bin/env python3
"""WCAG 2.1 AA contrast checker for this codebase.

    python3 scripts/check-contrast.py      # exits 1 if anything fails

Resolves the CSS custom-property graph separately for light and dark, then
checks every foreground/background pair it can determine statically:

  * CSS rules setting `color`, against their own background or the nearest
    known container surface (topnav/mobile-menu/hero sit on navy, not white)
  * Tailwind `bg-* / text-*` pairs on one element in .tsx
  * inline style={{ color, background }} pairs

Theme-aware: `.dark` rules are judged only in dark, and a base rule is skipped
in dark when the SAME FILE overrides it. Overrides are not shared across files
because different stylesheets load on different routes.

Thresholds: 4.5:1 normal text, 3:1 large text (>=24px, or >=18.66px bold).
Bold alone does not qualify as large. Disabled/placeholder rules are listed
separately: WCAG 1.4.3 exempts inactive controls, but they stay legible here.
"""
import re, pathlib, json, sys

NAMED={"white":"#ffffff","black":"#000000","transparent":None,"inherit":None,
       "currentcolor":None,"none":None,"red":"#ff0000"}
def sc(t): return re.sub(r'/\*.*?\*/','',t,flags=re.S)

def rules(css, media=""):
    css=sc(css); i=0; out=[]
    while i<len(css):
        b=css.find('{',i)
        if b<0: break
        sel=css[i:b].strip(); depth=1; j=b+1
        while j<len(css) and depth:
            if css[j]=='{': depth+=1
            elif css[j]=='}': depth-=1
            j+=1
        body=css[b+1:j-1]
        if sel.startswith('@'):
            if sel.startswith(('@media','@supports')): out.extend(rules(body,sel))
            elif '{' not in body: out.append((sel,body,media))
        else: out.append((sel,body,media))
        i=j
    return out

def decls(body):
    d={}
    for part in re.split(r';(?![^(]*\))', body):
        if ':' not in part or '{' in part: continue
        k,_,v=part.partition(':'); d[k.strip().lower()]=v.strip()
    return d

files=[p for p in list(pathlib.Path('.').glob('app/**/*.css'))+list(pathlib.Path('.').glob('components/**/*.css'))
       if 'node_modules' not in str(p)]
CUSTOMER=lambda p: 'customer' in str(p)

def build_vars(scope):
    """scope: 'app' or 'customer' — customer routes also load app/globals.css."""
    light,dark={},{}
    for p in files:
        if scope=='app' and CUSTOMER(p): continue
        for sel,body,_ in rules(p.read_text()):
            s=sel.lower(); tgt=None
            if s.startswith('@theme'): tgt='both'
            elif ':root' in s and '.dark' in s: tgt='both'
            elif '.dark' in s: tgt='dark'
            elif ':root' in s or s in ('html','body'): tgt='light'
            if not tgt: continue
            for k,v in decls(body).items():
                if not k.startswith('--'): continue
                if v.strip()==f'var({k})': continue   # self-map from @theme inline
                if tgt in ('light','both'): light[k]=v
                if tgt in ('dark','both'): dark[k]=v
    for k,v in light.items(): dark.setdefault(k,v)
    return light,dark
APP=build_vars('app'); CUST=build_vars('customer')

def resolve(val,vars,d=0):
    if val is None or d>12: return None
    val=val.strip().split('!important')[0].strip()
    m=re.fullmatch(r'var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)',val)
    if m:
        g=vars.get(m.group(1))
        r=resolve(g,vars,d+1) if g else None
        return r if r else (resolve(m.group(2),vars,d+1) if m.group(2) else None)
    low=val.lower()
    if low in NAMED: return NAMED[low]
    m=re.match(r'#([0-9a-fA-F]{3,8})\b',val)
    if m:
        h=m.group(1)
        if len(h)==3: h=''.join(c*2 for c in h)
        return '#'+h[:6] if len(h) in (6,8) else None
    m=re.match(r'rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.%]+))?\s*\)',val)
    if m:
        r,g,b=(int(float(m.group(i))) for i in (1,2,3)); a=m.group(4)
        al=float(a.rstrip('%'))/100 if a and a.endswith('%') else (float(a) if a else 1.0)
        return ('#%02x%02x%02x'%(min(r,255),min(g,255),min(b,255)),al)
    return None

def flat(c,bg):
    if c is None: return None
    if isinstance(c,tuple):
        col,a=c; bg=bg or '#ffffff'
        f=[int(col[i:i+2],16) for i in (1,3,5)]; b=[int(bg[i:i+2],16) for i in (1,3,5)]
        return '#%02x%02x%02x'%tuple(round(f[i]*a+b[i]*(1-a)) for i in range(3))
    return c
def lum(h):
    def s(c):
        c/=255; return c/12.92 if c<=.03928 else ((c+.055)/1.055)**2.4
    return .2126*s(int(h[1:3],16))+.7152*s(int(h[3:5],16))+.0722*s(int(h[5:7],16))
def cr(a,b):
    l=sorted([lum(a),lum(b)],reverse=True); return (l[0]+.05)/(l[1]+.05)

# Containers whose children sit on a colored surface, not the page surface.
def ancestor_bg(sel,vars):
    s=sel.lower()
    if re.search(r'(topnav|mobile-menu|mobile-brand|admin-header-banner|auth-hero)',s):
        return flat(resolve('var(--color-navy)',vars),'#ffffff')
    if 'logout-confirm-modal' in s or 'logout-cancel' in s or 'logout-confirm-button' in s:
        return flat(resolve('var(--color-surface)',vars),'#ffffff')
    return None

def finfo(d):
    fs=d.get('font-size',''); fw=d.get('font-weight','')
    px=None; m=re.match(r'([\d.]+)(px|rem|em)',fs)
    if m: px=float(m.group(1))*(16 if m.group(2) in('rem','em') else 1)
    try: bold=int(fw)>=700
    except: bold=fw in('bold','bolder')
    return bool(px and (px>=24 or (px>=18.66 and bold)))

# A base rule also applies in dark mode UNLESS a more specific `.dark <sel>`
# rule redefines colour for it. Scoped PER FILE: two stylesheets can load on
# different routes, so auth.css's .dark override cannot be assumed to cover
# auth-form.css's base rule.
DARK_OVERRIDES={}
for _p in files:
    s=set()
    for _sel,_body,_ in rules(_p.read_text()):
        if _sel.startswith('@') or '.dark' not in _sel.lower(): continue
        if 'color' not in decls(_body): continue
        for part in _sel.split(','):
            part=part.strip(); low=part.lower()
            if low.startswith('.dark '): s.add(part[6:].strip())
            elif low.startswith('.dark'): s.add(part[5:].strip())
    DARK_OVERRIDES[str(_p)]=s

SURF={'light':'#ffffff','dark':'#1e1e1e'}
fails=[]; warns=[]
for p in files:
    maps = CUST if CUSTOMER(p) else APP
    for sel,body,media in rules(p.read_text()):
        if sel.startswith('@'): continue
        d=decls(body)
        if 'color' not in d: continue
        bgraw=d.get('background-color') or d.get('background')
        dark_only='.dark' in sel.lower()
        themes=[('dark',maps[1])] if dark_only else [('light',maps[0]),('dark',maps[1])]
        sel_parts=[s.strip() for s in sel.split(',')]
        overridden = any(sp in DARK_OVERRIDES[str(p)] for sp in sel_parts)
        for theme,vars in themes:
            if theme=='dark' and overridden and not dark_only: continue
            anc=ancestor_bg(sel,vars) or SURF[theme]
            bg=flat(resolve(bgraw,vars),anc) if bgraw else None
            if bgraw and bg is None: continue
            if bg is None: bg=anc
            fg=flat(resolve(d['color'],vars),bg)
            if not fg: continue
            r=cr(fg,bg); need=3.0 if finfo(d) else 4.5
            if r<need:
                rec=(round(r,2),need,theme,str(p),sel.strip()[:56],fg,bg)
                (warns if ':disabled' in sel or 'placeholder' in sel else fails).append(rec)
fails.sort(); warns.sort()
def show(title,rows):
    print(f"\n{title}: {len(rows)}")
    if rows:
        print(f"{'ratio':>6} {'need':>5} {'theme':<6} {'fg':<8} {'bg':<8} file :: selector")
        print("-"*110)
        for r,n,t,f,s,fg,bg in rows:
            print(f"{r:6.2f} {n:5.1f} {t:<6} {fg:<8} {bg:<8} {f.split('/')[-1]} :: {s}")
show("CSS FAILURES",fails)
show("CSS disabled/placeholder (WCAG-exempt, informational)",warns)


# ================= TSX =================
# Tailwind default palette subset actually used in this repo
TW={'white':'#ffffff','black':'#000000',
 'red-500':'#ef4444','red-700':'#b91c1c','red-600':'#dc2626',
 'gray-400':'#9ca3af','gray-500':'#6b7280','gray-600':'#4b5563',
 'slate-400':'#94a3b8','slate-500':'#64748b',
 'blue-600':'#2563eb','blue-700':'#1d4ed8','green-600':'#16a34a'}

def tok(kind, name, vars):
    """Resolve a tailwind colour utility to hex."""
    if name in TW: return TW[name]
    m=re.fullmatch(r'\[(#[0-9a-fA-F]{3,6})\]', name)
    if m: return resolve(m.group(1),vars)
    m=re.fullmatch(r'([a-z-]+)/(\d+)', name)          # e.g. white/65
    if m:
        base=TW.get(m.group(1)) or resolve(f'var(--color-{m.group(1)})',vars)
        if isinstance(base,str): return (base, int(m.group(2))/100)
        return None
    return resolve(f'var(--color-{name})',vars)

SURF={'light':'#ffffff','dark':'#1e1e1e'}
CLASS_RE=re.compile(r'className=(?:"([^"]*)"|\{`([^`]*)`\})')
rows=[]
for p in sorted(list(pathlib.Path('app').rglob('*.tsx'))+list(pathlib.Path('components').rglob('*.tsx'))):
    maps = CUST if 'customer' in str(p) else APP
    src=p.read_text()
    for m in CLASS_RE.finditer(src):
        cls=(m.group(1) or '')+' '+(m.group(2) or '')
        classes=cls.split()
        bgs=[c[3:] for c in classes if c.startswith('bg-') and not c.startswith('bg-gradient')]
        txts=[c[5:] for c in classes if c.startswith('text-')]
        # keep only colour-ish text utils (drop text-sm, text-[13px], text-center...)
        txts=[t for t in txts if not re.match(r'^(xs|sm|base|lg|xl|\d?xl|left|right|center|justify|\[\d)', t)]
        if not bgs or not txts: continue
        big = any(re.match(r'^(2xl|3xl|4xl|5xl|\[(2[4-9]|[3-9]\d)px\])',c[5:]) for c in classes if c.startswith('text-'))
        bold = any(c in ('font-bold','font-extrabold','font-black','font-semibold') for c in classes)
        for theme in ('light','dark'):
            vars=maps[0] if theme=='light' else maps[1]
            for b in bgs:
                for t in txts:
                    bgc=flat(tok('bg',b,vars),SURF[theme]); fgc=flat(tok('text',t,vars),bgc or SURF[theme])
                    if not bgc or not fgc: continue
                    r=cr(fgc,bgc); need=3.0 if big else 4.5   # bold alone is not 'large text'
                    if r<need:
                        rows.append((round(r,2),need,theme,str(p),f"bg-{b} / text-{t}",fgc,bgc))
# inline style={{ color: X, background: Y }}
STYLE_RE=re.compile(r'style=\{\{([^}]*)\}\}')
for p in sorted(list(pathlib.Path('app').rglob('*.tsx'))+list(pathlib.Path('components').rglob('*.tsx'))):
    maps = CUST if 'customer' in str(p) else APP
    for m in STYLE_RE.finditer(p.read_text()):
        body=m.group(1)
        c=re.search(r'\bcolor:\s*"([^"]+)"',body); b=re.search(r'(?:background|backgroundColor):\s*"([^"]+)"',body)
        if not c or not b: continue
        for theme in ('light','dark'):
            vars=maps[0] if theme=='light' else maps[1]
            bgc=flat(resolve(b.group(1),vars),SURF[theme]); fgc=flat(resolve(c.group(1),vars),bgc or SURF[theme])
            if not bgc or not fgc: continue
            r=cr(fgc,bgc)
            if r<4.5: rows.append((round(r,2),4.5,theme,str(p),"inline style",fgc,bgc))
rows=sorted(set(rows))
print(f"TSX FAILURES: {len(rows)}")
if rows:
    print(f"{'ratio':>6} {'need':>5} {'theme':<6} {'fg':<8} {'bg':<8} file :: pair")
    print("-"*112)
    for r,n,t,f,pair,fg,bg in rows:
        print(f"{r:6.2f} {n:5.1f} {t:<6} {fg:<8} {bg:<8} {f} :: {pair}")

import sys
sys.exit(1 if (fails or warns or rows) else 0)
