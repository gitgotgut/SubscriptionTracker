"use client";

import { useEffect, useRef, useState } from "react";

type Sub = { name: string; cat: string; amount: number; color: string };

const SUBS: Sub[] = [
  { name: "Netflix",        cat: "Streaming", amount: 15.99, color: "bg-purple-100 text-purple-700" },
  { name: "Spotify",        cat: "Streaming", amount:  9.99, color: "bg-purple-100 text-purple-700" },
  { name: "Gym membership", cat: "Fitness",   amount: 34.99, color: "bg-green-100 text-green-700"   },
  { name: "HelloFresh",     cat: "Food",      amount: 24.00, color: "bg-orange-100 text-orange-700" },
];

function useCountUp(target: number, duration = 380) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return;

    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(from + (target - from) * ease);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function SubCard({ name, cat, amount, color }: Sub) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{cat}</span>
      <span className="flex-1 text-sm font-medium text-gray-800">{name}</span>
      <span className="text-sm font-semibold text-gray-900">${amount.toFixed(2)}/mo</span>
    </div>
  );
}

export function DashboardPreview() {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (step < SUBS.length) {
      // reveal next subscription
      t = setTimeout(() => setStep((s) => s + 1), 900);
    } else {
      // all visible — pause, then fade out and reset
      t = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setStep(0);
          setTimeout(() => setFading(false), 80);
        }, 500);
      }, 2800);
    }
    return () => clearTimeout(t);
  }, [step]);

  const monthly = SUBS.slice(0, step).reduce((s, sub) => s + sub.amount, 0);
  const annual = monthly * 12;
  const displayMonthly = useCountUp(monthly);
  const displayAnnual = useCountUp(annual);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 bg-white">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-4 flex-1 rounded bg-gray-100 h-5 max-w-xs text-xs text-gray-400 flex items-center px-3">
            hugo.app/dashboard
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400 mb-1">Monthly spend</p>
              <p className="text-2xl font-bold text-gray-900">${fmt(displayMonthly)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400 mb-1">Annual spend</p>
              <p className="text-2xl font-bold text-gray-900">${fmt(displayAnnual)}</p>
            </div>
          </div>

          {/* Subscription list — fixed height to prevent layout shift */}
          <div className="space-y-2 h-[208px]">
            {SUBS.slice(0, step).map((sub) => (
              <SubCard key={sub.name} {...sub} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
