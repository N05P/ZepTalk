import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {ClerkProvider} from "@clerk/nextjs";
import ConvexClientProvider from "@/app/ConvexClientProvider";
import PresenceHandler from "@/components/PresenceHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZepTalk",
  description: "Zeptalk enables instant, secure, real-time conversations effortlessly.",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <ClerkProvider>
            <ConvexClientProvider>
                <PresenceHandler/>
                {children}
            </ConvexClientProvider>
        </ClerkProvider>
        </body>
        </html>
    );
}