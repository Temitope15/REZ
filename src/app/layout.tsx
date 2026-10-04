import type {Metadata} from 'next'
import {Bricolage_Grotesque, Geist_Mono, Instrument_Sans} from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({variable: '--font-display-face', subsets: ['latin'], weight: ['600', '700', '800']})
const body = Instrument_Sans({variable: '--font-body', subsets: ['latin']})
const mono = Geist_Mono({variable: '--font-geist-mono', subsets: ['latin']})

export const metadata: Metadata = {
  title: 'REZ · Your customers, answered',
  description: 'Paste your website link. REZ learns your business and answers your customers day and night. When it can’t help, it hands the question to you.',
}

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
