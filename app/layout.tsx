import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tagesschau Summary",
  description: "Daily summaries of Tagesschau episodes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
