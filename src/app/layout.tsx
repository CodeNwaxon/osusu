import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Osusu - Group Contribution Platform",
  description: "Create or Join an Osusu Group. Transparent, secure, and reliable.",
  icons: {
    icon: "/favicon.svg",
    apple: "/osusu_logo2.png",
  },
  openGraph: {
    title: "Osusu - Group Contribution Platform",
    description: "Create or Join an Osusu Group. Transparent, secure, and reliable.",
    url: "https://osusu-9ja.vercel.app", // replace with actual URL if known
    siteName: "Osusu 9ja",
    images: [
      {
        url: "https://res.cloudinary.com/dqm6hjihm/image/upload/v1785013052/osusu_hero_v1l6io.jpg",
        width: 1200,
        height: 630,
        alt: "Osusu - Build Wealth Together",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osusu - Group Contribution Platform",
    description: "Create or Join an Osusu Group. Transparent, secure, and reliable.",
    images: ["https://res.cloudinary.com/dqm6hjihm/image/upload/v1785013052/osusu_hero_v1l6io.jpg"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
