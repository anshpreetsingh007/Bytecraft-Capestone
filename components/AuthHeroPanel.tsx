import Image from "next/image";

type AuthHeroPanelProps = {
  headline: string;
  subtext: string;
  imageSrc?: string;
};

export function AuthHeroPanel({ headline, subtext, imageSrc }: AuthHeroPanelProps) {
  return (
    <aside className="auth-hero-panel" aria-hidden="true">
      {imageSrc && (
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="auth-hero-illustration"
          style={{ objectFit: "cover" }}
          priority
        />
      )}
      <div className="auth-hero-tint" />
      <div className="auth-hero-text">
        <h2>{headline}</h2>
        <p>{subtext}</p>
      </div>
    </aside>
  );
}
