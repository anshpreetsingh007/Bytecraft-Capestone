import Link from "next/link";

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className={`font-display font-bold text-xl tracking-tight flex items-center gap-2.5 ${
        dark ? "text-white" : "text-foreground"
      }`}
    >
      <svg
        viewBox="0 0 22 18"
        fill="none"
        className="w-[22px] h-[18px] shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 17L11 1L21 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M6 17V10H16V17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      Markit Roofing
    </Link>
  );
}
