import type { Metadata } from "next";
import { Outfit, Poppins } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",  // ✅ Prevents FOUT (flash of unstyled text)
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",  // ✅ Prevents FOUT
});

export const metadata: Metadata = {
  title: "Fee Defaulter System",
  description: "Modern College Fee Management Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* ✅ Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${outfit.variable} ${poppins.variable} font-poppins bg-[#0f172a] text-[#f8fafc] min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
