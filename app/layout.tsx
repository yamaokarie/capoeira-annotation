import type { Metadata } from "next";
import { DM_Sans, EB_Garamond, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const bogueBlack = localFont({
  src: "./fonts/Bogue-Black.ttf",
  variable: "--font-bogue",
  weight: "900",
});

export const metadata: Metadata = {
  title: "Capoeira Annotation",
  description: "Mark and annotate capoeira jogo moments",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} ${ebGaramond.variable} ${bogueBlack.variable}`}
    >
      <body className="min-h-full">
        <div className="relative mx-auto min-h-screen app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
