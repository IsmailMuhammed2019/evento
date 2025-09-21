import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simple Attendance",
  description: "Simple QR code attendance system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <Navigation />
          {children}
          <Toaster position="top-right" />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
