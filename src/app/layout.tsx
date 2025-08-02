"use client";
import { usePathname } from "next/navigation";
import NavigationHeader from "../../component/NavigationHeader";
import "./globals.css";
import { COLORS } from "../../component/Home";

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
        <main className={`${hideNavigation ? "" : "pt-0"} ${COLORS.background.gradient} min-h-screen h-screen`}>{children}</main>
      </body>
    </html>
  );
}
