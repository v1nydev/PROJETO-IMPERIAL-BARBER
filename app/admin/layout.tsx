import type { Metadata } from "next";
import "./admin-auth.css";

export const metadata: Metadata = {
  title: "Acesso administrativo — Imperial Barber",
  description: "Área reservada da Imperial Barber.",
};

export default function AdminRouteBoundary({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
