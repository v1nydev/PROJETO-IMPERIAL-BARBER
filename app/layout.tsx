import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://projeto-imperial-barber.contato-v1nydev.workers.dev"),
  title: "Imperial Barber — Precisão é uma forma de presença",
  description:
    "Agendamento online e gestão completa para uma barbearia de presença, precisão e tradição em São Paulo.",
  applicationName: "Imperial Barber",
  creator: "V1NY.DEV",
  keywords: [
    "barbearia",
    "agendamento online",
    "gestão de barbearia",
    "barbeiro",
    "São Paulo",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Imperial Barber",
    title: "Imperial Barber — Precisão é uma forma de presença",
    description:
      "Agendamento online e gestão completa para uma barbearia de presença, precisão e tradição.",
    images: [
      {
        url: "/images/imperial-hero.png",
        width: 1536,
        height: 1024,
        alt: "Mestre barbeiro realizando um corte na Imperial Barber",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
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
