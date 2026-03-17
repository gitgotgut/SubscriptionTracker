"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, List, BarChart2, Download, Users, Settings2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarNav, type SidebarNavItem } from "@/components/sidebar-nav";
import { useT } from "@/lib/i18n";

export default function SubscriptionsLayout({ children }: { children: ReactNode }) {
  const t = useT();

  const NAV_ITEMS: SidebarNavItem[] = [
    { href: "/subscriptions", label: t("sidebar.overview"), icon: LayoutDashboard },
    { href: "/subscriptions/list", label: t("modules.subscriptions"), icon: List },
    { href: "/subscriptions/analytics", label: t("sidebar.analytics"), icon: BarChart2 },
    { href: "/subscriptions/import", label: t("sidebar.import"), icon: Download },
    { href: "/subscriptions/household", label: t("dashboard.household"), icon: Users },
    { href: "/subscriptions/settings", label: t("sidebar.settings"), icon: Settings2 },
  ];

  return (
    <>
      <DashboardHeader sidebarItems={NAV_ITEMS} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-56 border-r bg-card shrink-0">
          <SidebarNav items={NAV_ITEMS} />
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
