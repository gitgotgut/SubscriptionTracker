"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { toMonthlyCents, centsToDisplay } from "@/lib/utils";

type Subscription = {
  category: string;
  amountCents: number;
  billingCycle: string;
};

const COLORS: Record<string, string> = {
  Streaming: "#8b5cf6",
  Music: "#ec4899",
  Gaming: "#f59e0b",
  "News & Media": "#0ea5e9",
  Fitness: "#22c55e",
  Food: "#f97316",
  Software: "#3b82f6",
  "Cloud Storage": "#14b8a6",
  Education: "#a855f7",
  "VPN & Security": "#ef4444",
  Productivity: "#84cc16",
  Shopping: "#f43f5e",
  Other: "#6b7280",
};

export function SpendingChart({ subscriptions, formatValue = (s: string) => `$${s}` }: { subscriptions: Subscription[]; formatValue?: (s: string) => string }) {
  if (subscriptions.length === 0) return null;

  const byCategory = subscriptions.reduce<Record<string, number>>((acc, sub) => {
    const monthly = toMonthlyCents(sub.amountCents, sub.billingCycle);
    acc[sub.category] = (acc[sub.category] ?? 0) + monthly;
    return acc;
  }, {});

  const data = Object.entries(byCategory).map(([name, cents]) => ({
    name,
    value: cents,
    display: `${formatValue(centsToDisplay(cents))}/mo`,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#6b7280"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(_value, _name, props) => [props.payload.display, props.payload.name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
