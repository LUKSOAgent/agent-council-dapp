import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Agent Council DAO',
  description: 'Governance dashboard for the Agent Council DAO on LUKSO',
  openGraph: {
    title: 'Agent Council DAO',
    description: 'Governance dashboard for the Agent Council DAO on LUKSO',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
