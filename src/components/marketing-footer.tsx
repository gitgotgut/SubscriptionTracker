import Link from "next/link";
import { Layers } from "lucide-react";
import { FEATURES } from "@/lib/features";

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm tracking-tight">Subtrack</span>
            </Link>
            <p className="text-xs text-gray-400 max-w-xs">
              A simple tool to keep every subscription in one place and know exactly what you&apos;re spending.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 text-xs text-gray-400">
            <div>
              <p className="font-medium text-gray-600 mb-2">Product</p>
              <ul className="space-y-1.5">
                <li><Link href="/register" className="hover:text-gray-600 transition-colors">Get started</Link></li>
                <li><Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">Features</p>
              <ul className="space-y-1.5">
                {FEATURES.map((f) => (
                  <li key={f.href}>
                    <Link href={f.href} className="hover:text-gray-600 transition-colors">{f.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-600 mb-2">Legal</p>
              <ul className="space-y-1.5">
                <li><span className="cursor-default">Privacy policy</span></li>
                <li><span className="cursor-default">Terms of service</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Subtrack. Built to keep your subscriptions honest.
          </p>
        </div>
      </div>
    </footer>
  );
}
