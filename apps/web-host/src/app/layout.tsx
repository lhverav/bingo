import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bingo Host',
  description: 'Panel de administración para el host del bingo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
