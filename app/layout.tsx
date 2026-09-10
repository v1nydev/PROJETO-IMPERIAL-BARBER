import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imperial Barber — Precisão é uma forma de presença",
  description: "Cortes clássicos, barba à toalha quente e atendimento reservado em São Paulo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
