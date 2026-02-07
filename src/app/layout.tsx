import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Ninja Flow',
  description: 'A box-breathing tool to help you find your flow.',
  applicationName: 'Ninja Flow',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon-192.png',
    },
  },
  appleWebApp: {
    capable: true,
    title: 'Ninja Flow',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#7950F2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn('font-body antialiased')}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
