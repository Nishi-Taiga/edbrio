"use client";

import { usePathname } from "@/i18n/navigation";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { MobileFooter } from "./mobile-footer";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Hide the global header on the landing page and admin routes.
  if (
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/curriculum")
  )
    return null;

  const hasSidebar =
    pathname?.startsWith("/teacher") || pathname?.startsWith("/guardian");

  return (
    <>
      <Header showMenuButton={hasSidebar} />
      {hasSidebar && <MobileSidebar />}
      {hasSidebar && <MobileFooter />}
    </>
  );
}
