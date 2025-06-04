import { ReactNode } from 'react'
import { ThemeProvider } from '@/app/providers/ThemeProvider'

interface LayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="light" storageKey="kitchen-pantry-theme">
          <div className="min-h-screen bg-background">
            {/* Temporary bypass - no auth check */}
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}