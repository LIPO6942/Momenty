
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { TimelineProvider } from '@/context/timeline-context';
import { AuthProvider } from '@/context/auth-context';


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
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/android-chrome-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/android-chrome-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Momenty" />
      </head>
      <body
        className={cn(
          'font-body antialiased min-h-screen bg-secondary text-base'
        )}
      >
        <AuthProvider>
          <TimelineProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-24">{children}</main>
              <BottomNav />
            </div>
            <Toaster />
          </TimelineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
