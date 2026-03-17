import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { getServerT } from "@/lib/server-i18n";

export const metadata = {
  title: "Privacy Policy — Hugo",
  description: "Hugo's Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default async function PrivacyPage() {
  const t = await getServerT();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-2xl mx-auto px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t("policies.privacy.title")}</h1>
          <p className="text-xs text-gray-400">{t("policies.privacy.lastUpdated")}</p>
        </section>

        {/* Intro */}
        <section className="max-w-2xl mx-auto px-6 pb-16">
          <p className="text-gray-600 leading-relaxed mb-12">{t("policies.privacy.intro")}</p>

          {/* Information We Collect */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.collectTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.collectBody")}</p>
          </div>

          {/* How We Use Information */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.useTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.useBody")}</p>
          </div>

          {/* Third-Party Data Sharing */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.thirdPartyTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.thirdPartyBody")}</p>
          </div>

          {/* Data Security */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.securityTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.securityBody")}</p>
          </div>

          {/* Your Rights */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.rightsTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.rightsBody")}</p>
          </div>

          {/* Data Retention */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.retentionTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.retentionBody")}</p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t("policies.privacy.contactTitle")}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t("policies.privacy.contactBody")}</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
