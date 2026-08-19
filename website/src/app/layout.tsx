import type { Metadata } from 'next';
import './globals.css';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Find My Doggo — reunite lost dogs with their families',
    template: '%s — Find My Doggo',
  },
  description:
    'Report a lost or found dog with a photo and location, browse listings, see them on a map, and message the person who posted.',
  keywords: ['lost dogs', 'found dogs', 'pet finder', 'dog rescue', 'missing pets'],
  openGraph: {
    type: 'website',
    siteName: 'Find My Doggo',
    title: 'Find My Doggo — reunite lost dogs with their families',
    description: 'Report a lost or found dog, browse listings, and see them on a map.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
