import type { Metadata } from "next";
import { DM_Sans, Geist, Inter, Source_Serif_4 } from "next/font/google";
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

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: "400",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400"],
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
      className={`${inter.variable} ${dmSans.variable} ${geist.variable} ${sourceSerif.variable} ${bogueBlack.variable}`}
    >
      <body className="min-h-full">
        <div className="relative mx-auto min-h-screen app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
