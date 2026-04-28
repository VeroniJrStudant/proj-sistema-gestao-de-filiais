import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BackToTopButton } from "@/components/back-to-top-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestão",
  description: "Gestão de bens, presença, estoques, segurança e financeiro de bens.",
};

const themeInitScript = `(function(){try{var k='creche-theme';var s=localStorage.getItem(k);var d=document.documentElement;if(s==='dark'){d.classList.add('dark');}else if(s==='light'){d.classList.remove('dark');}else{if(window.matchMedia('(prefers-color-scheme: dark)').matches){d.classList.add('dark');}else{d.classList.remove('dark');}}if(d.classList.contains('dark')){d.removeAttribute('data-palette');try{localStorage.removeItem('creche-palette');}catch(e){}}else{d.setAttribute('data-palette','park');try{localStorage.setItem('creche-palette','park');}catch(e){}}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <BackToTopButton />
      </body>
    </html>
  );
}
