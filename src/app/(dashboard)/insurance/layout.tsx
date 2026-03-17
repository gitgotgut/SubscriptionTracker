"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Award,
  AlertCircle,
  CreditCard,
  FolderOpen,
  Settings2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarNav, type SidebarNavItem } from "@/components/sidebar-nav";
import { useT } from "@/lib/i18n";

export default function InsuranceLayout({ children }: { children: ReactNode }) {
  const t = useT();

  const NAV_ITEMS: SidebarNavItem[] = [
    { href: "/insurance", label: t("sidebar.home"), icon: LayoutDashboard },
    { href: "/insurance/policies", label: t("insurance.policies"), icon: Shield },
    { href: "/insurance/proposals", label: t("sidebar.proposals"), icon: FileText },
    { href: "/insurance/certificates", label: t("sidebar.certificates"), icon: Award },
    { href: "/insurance/claims", label: t("sidebar.claims"), icon: AlertCircle },
    { href: "/insurance/billing", label: t("sidebar.billing"), icon: CreditCard },
    { href: "/insurance/files", label: t("sidebar.files"), icon: FolderOpen },
    { href: "/insurance/settings", label: t("sidebar.settings"), icon: Settings2 },
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
