import type { Metadata } from "next";
import { Caveat, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrototypeNotice from "@/components/PrototypeNotice";
import { PROTOTYPE, SIGNATURE } from "@/lib/prototype";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  // Le gabarit ajoute la mention à TOUTES les pages, y compris les fiches
  // marchands : c'est souvent une page profonde qu'on partage par lien, et
  // c'est là qu'un visiteur risque le plus de se méprendre sur l'origine.
  title: {
    default: PROTOTYPE
      ? `L'Alimentation à la Source (${SIGNATURE})`
      : "L'Alimentation à la Source",
    template: PROTOTYPE ? `%s (${SIGNATURE})` : "%s",
  },
  description:
    "Carte des marchands locaux, fermes en vente directe et marchés de producteurs autour de Fréjus et Saint-Raphaël." +
    (PROTOTYPE
      ? " Site prototype, présenté pour proposition au CSE Bonnet : il n'émane pas du Centre Hospitalier Intercommunal Fréjus Saint-Raphaël."
      : ""),
  // Tant que le projet n'est pas validé, il n'a rien à faire dans les moteurs
  // de recherche : un site non officiel qui remonte sur le nom de l'hôpital
  // est exactement ce qu'on cherche à éviter. Voir aussi app/robots.ts.
  robots: PROTOTYPE ? { index: false, follow: false } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <PrototypeNotice />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
