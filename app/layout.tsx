import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealthLiteracy AI — Your medical records, in your language',
  description:
    'Paste, upload, or speak any clinical note. Get a plain-language translation your whole family can understand. Free, private, and built for patients.',
  openGraph: {
    title: 'HealthLiteracy AI',
    description: 'Your medical records, in your language.',
    type: 'website',
    siteName: 'HealthLiteracy AI',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://healthliteracy.vercel.app'
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
