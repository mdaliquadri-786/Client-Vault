import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClientShare - Secure Client File Portal',
  description: 'Industrial-grade secure client file portal for freelancers and designers with Supabase Auth, PostgreSQL RLS, and encrypted file management.',
  openGraph: {
    title: 'ClientShare - Secure Client File Portal',
    description: 'Industrial-grade secure client file portal for freelancers and designers with Supabase Auth, PostgreSQL RLS, and encrypted file management.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
