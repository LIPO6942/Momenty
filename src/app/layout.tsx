import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { TimelineProvider } from '@/context/timeline-context';

export const metadata: Metadata = {
  title: 'Momenty - Votre journal de voyage',
  description: 'Mémorisez et organisez les instants de votre voyage.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={cn(
          'font-body antialiased min-h-screen bg-secondary text-base'
        )}
      >
        <TimelineProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </div>
          <Toaster />
        </TimelineProvider>
      </body>
    </html>
  );
}
