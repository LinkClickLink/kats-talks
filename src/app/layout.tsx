import type { Metadata } from 'next'
import { Nunito, Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Kats Talks Manager',
  description: 'Gestión de contenido para @kats.talks — gatos Pixar 3D con Veo3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${nunito.variable} ${montserrat.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}