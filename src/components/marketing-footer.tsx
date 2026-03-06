import Link from "next/link";
import { Layers } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { getServerT } from "@/lib/server-i18n";

export async function MarketingFooter() {
  const t = await getServerT();
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm tracking-tight">Hugo</span>
            </Link>
            <p className="text-xs text-gray-400 max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 text-xs text-gray-400">
            <div>
              <p className="font-medium text-gray-600 mb-2">{t("footer.product")}</p>
              <ul className="space-y-1.5">
                <li><Link href="/register" className="hover:text-gray-600 transition-colors">{t("footer.getStarted")}</Link></li>
                <li><Link href="/login" className="hover:text-gray-600 transition-colors">{t("footer.signIn")}</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-600 transition-colors">{t("footer.pricing")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">{t("footer.company")}</p>
              <ul className="space-y-1.5">
                <li><Link href="/about" className="hover:text-gray-600 transition-colors">{t("footer.about")}</Link></li>
                <li><Link href="/faq" className="hover:text-gray-600 transition-colors">{t("footer.faq")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">{t("footer.featuresHeading")}</p>
              <ul className="space-y-1.5">
                {FEATURES.map((f) => (
                  <li key={f.href}>
                    <Link href={f.href} className="hover:text-gray-600 transition-colors">{t(f.nameKey)}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">{t("footer.legal")}</p>
              <ul className="space-y-1.5">
                <li><span className="cursor-default">{t("footer.privacyPolicy")}</span></li>
                <li><span className="cursor-default">{t("footer.termsOfService")}</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
