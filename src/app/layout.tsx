"use client";
import { usePathname } from "next/navigation";
import NavigationHeader from "../../component/NavigationHeader";
import { SkipLinks } from "../../component/SkipLinks";
import "./globals.css";
import { COLORS } from "../../component/Home";
import { NotificationsProvider } from "../../lib/notifications-context";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Don't show navigation on auth pages
  const hideNavigation = pathname?.startsWith("/onboarding/");
  return (
    <html lang="en">
      <body className={` antialiased`}>
        <Providers>
          <NotificationsProvider>
            {/* Skip links for keyboard navigation accessibility */}
            <SkipLinks />

            {/* Header with navigation */}
            {!hideNavigation && (
              <header role="banner">
                <NavigationHeader />
              </header>
            )}

            {/* Main content area */}
            <main
              id="main-content"
              role="main"
              className={`${hideNavigation ? "" : "pt-0"} ${COLORS.background.gradient} min-h-screen h-screen`}
            >
              {children}
            </main>
          </NotificationsProvider>
        </Providers>
      </body>
    </html>
  );
}
