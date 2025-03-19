import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ContextProvider from "../../context";
import Navbar from '../components/Navbar'
import { SettingsProvider } from '../context/SettingsContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TBC-NFT",
  description: "NFT platform to manage Club Membership NFTs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider cookies={undefined}>
          <SettingsProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </SettingsProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
