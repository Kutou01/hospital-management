import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/toast-provider"
import { EnhancedAuthProvider } from "@/lib/auth/enhanced-auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Hospital Management",
  description: "Your partner in health and wellness",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<html lang="en" suppressHydrationWarning={true}>
        <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <EnhancedAuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </EnhancedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
