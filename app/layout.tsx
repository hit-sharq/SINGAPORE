import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { ServiceWorkerRegistrar } from '@/components/service-worker-registrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Singapore Club · Operations',
  description: 'A connected operations system for Singapore Club service, sales, inventory, staff, and guest experience.',
  // icons come from the app/ file conventions: icon.svg, icon.png, apple-icon.png
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Singapore Club',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  // the auth and POS screens already pad around the notch and home indicator
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ClerkProvider>
          <ServiceWorkerRegistrar />
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ClerkProvider>
      </body>
    </html>
  )
}
