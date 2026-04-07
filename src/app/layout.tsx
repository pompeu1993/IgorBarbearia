/* eslint-disable */
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/RouteGuard";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "A Elite do Corte | The Barber Elite",
  description: "Eleve seu estilo a um novo patamar. Agende seu horário na The Barber Elite e experimente o padrão ouro em barbearia clássica e moderna com o Igor.",
  openGraph: {
    title: "A Elite do Corte | The Barber Elite",
    description: "Eleve seu estilo a um novo patamar. Agende seu horário na The Barber Elite e experimente o padrão ouro em barbearia clássica e moderna.",
    url: "https://thebarberelite.com", // Substituted dynamically if hosted
    siteName: "The Barber Elite",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Barber Elite - Tesoura Dourada",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "A Elite do Corte | The Barber Elite",
    description: "O padrão ouro em barbearia clássica e moderna com o Igor. Agende seu horário exclusvio.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased font-display`}>
        <AuthProvider>
          <div className="relative flex min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-black border-x border-zinc-900">
            <div className="absolute inset-0 carbon-bg opacity-30 pointer-events-none"></div>
            <RouteGuard>
              {children}
            </RouteGuard>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
