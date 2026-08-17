"use client";

import type { ReactNode } from "react";

export interface AdminHeroChip {
  label: string;
  value: ReactNode;
}

/**
 * The gradient banner that opens every admin page.
 *
 * Styling lives in app/admin/admin-theme.css (`.adm-hero*`), which is loaded
 * once by the admin layout — so pages only need to supply content.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  chips,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Small glass stat chips shown on the right of the banner. */
  chips?: AdminHeroChip[];
  /** Buttons or links rendered alongside the chips. */
  actions?: ReactNode;
}) {
  return (
    <header className="adm-hero">
      <span className="adm-hero-rail" aria-hidden="true" />

      <div className="adm-hero-inner">
        <div>
          {eyebrow && (
            <span className="adm-eyebrow">
              <span className="adm-eyebrow-dot" aria-hidden="true" />
              {eyebrow}
            </span>
          )}

          <h1 className="adm-hero-title">{title}</h1>

          {subtitle && <p className="adm-hero-sub">{subtitle}</p>}
        </div>

        {(chips?.length || actions) && (
          <div className="adm-hero-actions">
            {chips?.map((chip) => (
              <div className="adm-hero-chip" key={chip.label}>
                <span className="adm-hero-chip-label">{chip.label}</span>
                <span className="adm-hero-chip-value">{chip.value}</span>
              </div>
            ))}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
