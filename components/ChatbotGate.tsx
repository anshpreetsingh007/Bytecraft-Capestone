"use client";

import { usePathname } from "next/navigation";
import Chatbot from "./Chatbot";

const ALLOWED_PREFIXES = ["/customer"];

export default function ChatbotGate() {
  const pathname = usePathname();
  const allowed = ALLOWED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (!allowed) return null;
  return <Chatbot />;
}
