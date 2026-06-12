import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'IPAM Connect - Student Networking Platform',
  description: 'Secure student networking, communication, and collaboration platform for IPAM',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <div id="__next" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
