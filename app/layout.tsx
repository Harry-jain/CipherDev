import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CipherDev - Privacy-First AI Chat',
  description: 'Run powerful AI models entirely in your browser. No data ever leaves your device.',
  keywords: ['AI', 'privacy', 'WebGPU', 'local AI', 'browser AI', 'CipherDev'],
  authors: [{ name: 'CipherDev Team' }],
  openGraph: {
    title: 'CipherDev - Privacy-First AI Chat',
    description: 'Run powerful AI models entirely in your browser. No data ever leaves your device.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CipherDev - Privacy-First AI Chat',
    description: 'Run powerful AI models entirely in your browser. No data ever leaves your device.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

// Made with Bob
