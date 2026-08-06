import './globals.css'
import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import ThemeProvider from '@/components/ThemeProvider'
import AuthProvider from '@/components/AuthProvider'
import { siteConfig } from '@/config/content'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-950">
              <div className="relative z-10 min-h-screen flex flex-col">
                {children}
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 