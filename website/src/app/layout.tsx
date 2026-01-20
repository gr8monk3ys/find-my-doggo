import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Find My Doggo - Reunite Lost Dogs With Their Families',
  description:
    'Help find lost dogs and reunite them with their families. Report lost or found dogs, browse listings, and view dogs on a map.',
  keywords: ['lost dogs', 'found dogs', 'pet finder', 'dog rescue', 'missing pets'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
