import type { Metadata } from "next";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import SWRProvider from "@/components/SWRProvider";
import NavigationHandler from "@/components/NavigationHandler";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata: Metadata = {
  title: "Aurexia ERP - Manufacturing Excellence",
  description: "Enterprise Resource Planning system for metal-mechanical manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SWRProvider>
          <AuthInitializer />
          <NavigationHandler />
          {children}
          <ToasterProvider />
        </SWRProvider>
      </body>
    </html>
  );
}
