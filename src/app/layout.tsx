import type { Metadata } from 'next';
import { Inter, Oswald, Montserrat } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-display' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'LiveScoreFree | All Sports. One Score.',
  description: 'Navigate the global sports multiverse with real-time updates.',
  openGraph: {
    title: 'LiveScoreFree',
    description: 'All Sports. One Score.',
    url: 'https://livescorefree.online',
    siteName: 'LiveScoreFree',
    images: [
      {
        url: 'https://livescorefree.online/logo-night.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveScoreFree',
    description: 'Real-time sports scores global multiverse.',
  },
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script>
      </head>
      <body className={`${montserrat.className} ${oswald.variable} min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden`}>
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1 flex gap-8 pb-24 md:pb-8">
          <main className="flex-1 min-w-0">
            {children}
          </main>
          <Sidebar />
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
