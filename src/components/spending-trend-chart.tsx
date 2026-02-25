"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type MonthData = { label: string; totalCents: number };

export function SpendingTrendChart() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spending-history")
      .then((r) => r.json())
      .then((d) => {
        setData(d.months ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || data.length === 0) return null;

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.split(" ")[0]}
        />
        <YAxis
          tickFormatter={(v: number) => `$${fmt(v)}`}
          tick={{ fontSize: 11 }}
          width={60}
        />
        <Tooltip
          formatter={(value: number) => [`$${fmt(value)}`, "Monthly spend"]}
          labelFormatter={(label: string) => label}
        />
        <Bar dataKey="totalCents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
