export default function RoofLine({ dark = false }: { dark?: boolean }) {
  return <div className={`roofline ${dark ? "on-dark" : ""}`} />;
}
