import type { Metadata } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import AuthInterceptor from "@/components/AuthInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Farzandim-edu — Maktab Portali",
  description: "Farzandim-edu maktab boshqaruvi va ta'lim portali",
  icons: {
    icon: "/logo_round.webp",
    shortcut: "/logo_round.webp",
    apple: "/logo_round.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthInterceptor>{children}</AuthInterceptor>
      </body>
    </html>
  );
}
