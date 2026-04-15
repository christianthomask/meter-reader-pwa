import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meter Reader PWA',
  description: 'Track and manage utility meter readings',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meter Reader',
  },
}
