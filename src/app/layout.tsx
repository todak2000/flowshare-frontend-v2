"use client";
import { usePathname } from "next/navigation";
import NavigationHeader from "../../component/NavigationHeader";
import "./globals.css";

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
        {!hideNavigation && <NavigationHeader />}
        <main className={hideNavigation ? "" : "pt-0"}>{children}</main>
      </body>
    </html>
  );
}
