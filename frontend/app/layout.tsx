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
  weight: ["300", "400", "500", "600", "700", "800"],
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
        {/* ✅ Preconnect to Bootstrap Icons CDN (non-blocking) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* ✅ Load Bootstrap Icons asynchronously — non-render-blocking */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        {/* Fallback for no-JS browsers */}
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
          />
        </noscript>
      </head>
      <body
        className={`${outfit.variable} ${poppins.variable} font-poppins bg-[#0f172a] text-[#f8fafc] min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
