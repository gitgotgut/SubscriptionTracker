import Link from "next/link";
import { DashboardPreview } from "@/components/dashboard-preview";
import {
  CreditCard,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  Check,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { getServerT } from "@/lib/server-i18n";

export default async function Home() {
  const t = await getServerT();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      <MarketingHeader />

      <main className="flex-1">

        {/* ─── Hero ─── */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <p className="inline-block mb-6 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 tracking-wide uppercase">
            {t("landing.badge")}
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            {t("landing.heroTitle1")}
            <br />
            <span className="text-blue-600">{t("landing.heroTitle2")}</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-gray-500 mb-10 leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              {t("landing.startTracking")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("landing.signIn")}
            </Link>
          </div>
        </section>

        {/* ─── Dashboard preview (animated) ─── */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <DashboardPreview />
        </section>

        {/* ─── Features ─── */}
        <section className="bg-gray-50 border-y border-gray-100 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-gray-500 text-center mb-12 text-sm">
              {t("landing.featuresSubtitle")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <CreditCard className="h-5 w-5 text-blue-600" />,
                  title: t("landing.feature1Title"),
                  description: t("landing.feature1Desc"),
                },
                {
                  icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
                  title: t("landing.feature2Title"),
                  description: t("landing.feature2Desc"),
                },
                {
                  icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
                  title: t("landing.feature3Title"),
                  description: t("landing.feature3Desc"),
                },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Email import ─── */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-4">
                <Sparkles className="h-3.5 w-3.5" /> {t("landing.emailImportBadge")}
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">
                {t("landing.emailImportTitle")}
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
                {t("landing.emailImportSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gmail card */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t("landing.gmailTitle")}</p>
                    <p className="text-xs text-gray-500">{t("landing.gmailSubtitle")}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                  {t("landing.gmailDesc")}
                </p>
                <Link
                  href="/gmail"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  {t("landing.gmailLink")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Outlook card */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="13" height="18" rx="2" fill="#0078D4"/>
                      <rect x="9" y="7" width="13" height="10" rx="1.5" fill="#28A8E8"/>
                      <path d="M9 7L15.5 12L22 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t("landing.outlookTitle")}</p>
                    <p className="text-xs text-gray-500">{t("landing.outlookSubtitle")}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                  {t("landing.outlookDesc")}
                </p>
                <Link
                  href="/outlook"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                >
                  {t("landing.outlookLink")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Shared privacy note */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              {[
                { icon: <Mail className="h-3.5 w-3.5" />, text: t("landing.privacyReadOnly") },
                { icon: <Sparkles className="h-3.5 w-3.5" />, text: t("landing.privacyAI") },
                { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: t("landing.privacyNoStore") },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  {item.icon} {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {t("landing.howItWorksTitle")}
            </h2>
            <p className="text-gray-500 text-sm mb-14">
              {t("landing.howItWorksSubtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: t("landing.step1Title"),
                  description: t("landing.step1Desc"),
                },
                {
                  step: "02",
                  title: t("landing.step2Title"),
                  description: t("landing.step2Desc"),
                },
                {
                  step: "03",
                  title: t("landing.step3Title"),
                  description: t("landing.step3Desc"),
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <span className="mb-4 text-4xl font-bold text-blue-100 select-none">
                    {s.step}
                  </span>
                  <h3 className="font-semibold mb-2 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA strip ─── */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-blue-200 text-sm mb-8">
              {t("landing.ctaSubtitle")}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              {t("landing.ctaButton")} <ArrowRight className="h-4 w-4" />
            </Link>
            <ul className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-blue-200">
              {[t("landing.noCreditCard"), t("landing.deleteAnytime")].map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>

      <MarketingFooter />

    </div>
  );
}
