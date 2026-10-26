import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Caveat, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const caveat = Caveat({
  variable: '--font-hand',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'NeuraNest — Interactive AI Voice Tutors & Live Whiteboard Studio',
  description:
    'Learn anything with live AI voice tutors that cite your uploaded PDFs, sketch real-time Mermaid & KaTeX diagrams, and build SuperMemo SM-2 flashcards.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f2e6' },
    { media: '(prefers-color-scheme: dark)', color: '#141311' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'
      }
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${plusJakarta.variable} ${caveat.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
