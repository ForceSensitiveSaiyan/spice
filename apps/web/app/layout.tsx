import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SPICE – Smart Pantry Intelligence & Culinary Engine",
  description: "Turn your ingredients into a step-by-step meal plan with timing, flavour reasoning, and upgrade suggestions.",
  openGraph: {
    title: "SPICE – Smart Pantry Intelligence & Culinary Engine",
    description: "Turn your ingredients into a step-by-step meal plan with timing, flavour reasoning, and upgrade suggestions.",
    type: "website",
  },
  other: {
    "theme-color": "#f59e0b",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("spice-theme");if(t!=="light"){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className={`${inter.className} bg-surface text-stone-900 dark:bg-surface-dark dark:text-stone-100 min-h-screen`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
