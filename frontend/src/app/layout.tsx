import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Source_Serif_4, Caveat, Kalam, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SuppressWarnings } from "@/components/utils/SuppressWarnings";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: "700" });
const kalam = Kalam({ variable: "--font-kalam", subsets: ["latin"], weight: "700" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Bookends Hospitality", template: "%s | Bookends Hospitality" },
  description: "The house behind Capiche, Aiko, Beshak and Ghaslet.",
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} ${caveat.variable} ${kalam.variable} ${playfair.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <SuppressWarnings />
        {children}
      </body>
    </html>
  );
}
