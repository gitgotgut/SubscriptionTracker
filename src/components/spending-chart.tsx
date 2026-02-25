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
  Fitness: "#22c55e",
  Food: "#f97316",
  Software: "#3b82f6",
  Other: "#6b7280",
};

export function SpendingChart({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) return null;

  const byCategory = subscriptions.reduce<Record<string, number>>((acc, sub) => {
    const monthly = toMonthlyCents(sub.amountCents, sub.billingCycle);
    acc[sub.category] = (acc[sub.category] ?? 0) + monthly;
    return acc;
  }, {});

  const data = Object.entries(byCategory).map(([name, cents]) => ({
    name,
    value: cents,
    display: `$${centsToDisplay(cents)}/mo`,
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
