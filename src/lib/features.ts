import {
  Mail,
  MailOpen,
  Bell,
  BarChart3,
  TrendingUp,
  CreditCard,
  Globe,
  Calculator,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const FEATURES: Feature[] = [
  { name: "Gmail AI Import", href: "/gmail", icon: Mail, description: "Auto-detect subscriptions from receipts" },
  { name: "Outlook AI Import", href: "/outlook", icon: MailOpen, description: "Auto-detect subscriptions from Outlook" },
  { name: "Email Reminders", href: "/features/email-reminders", icon: Bell, description: "Renewal alerts and trial expiry warnings" },
  { name: "Spending Insights", href: "/features/spending-insights", icon: BarChart3, description: "Monthly trends and spending analysis" },
  { name: "Price Detection", href: "/features/price-detection", icon: TrendingUp, description: "Know when subscription prices change" },
  { name: "Subscription Tracking", href: "/features/subscription-tracking", icon: CreditCard, description: "All your subscriptions in one place" },
  { name: "Multi-Currency", href: "/features/multi-currency", icon: Globe, description: "Live exchange rates for global subs" },
  { name: "Cancel Calculator", href: "/features/cancel-calculator", icon: Calculator, description: "See how much you could save" },
  { name: "Household Sharing", href: "/features/household-sharing", icon: Users, description: "Share tracking with your family" },
];
