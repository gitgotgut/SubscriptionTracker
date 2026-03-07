"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Shield, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";

type Insight = {
  type: "overlap" | "gap" | "suggestion";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  relatedPolicies: string[];
};

const INSIGHT_STYLES: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  overlap: { icon: AlertTriangle, color: "text-amber-600" },
  gap: { icon: Shield, color: "text-blue-600" },
  suggestion: { icon: Lightbulb, color: "text-green-600" },
};

export function InsuranceAIInsights({ hasAnalyzedDocs }: { hasAnalyzedDocs: boolean }) {
  const t = useT();
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setInsights(null);

    try {
      const res = await fetch("/api/insurance/analyze-all", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("insuranceAI.analysisFailed"));
        return;
      }

      const data = await res.json();
      if (data.noData) {
        setError(t("insuranceAI.noAnalyzedDocs"));
        return;
      }
      setInsights(data.insights);
    } catch {
      setError(t("insuranceAI.analysisFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            {t("insuranceAI.aiInsightsTitle")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            disabled={loading || !hasAnalyzedDocs}
            onClick={handleAnalyze}
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("insuranceAI.analyzingCoverage")}</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" />{t("insuranceAI.analyzeCoverage")}</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnalyzedDocs && !insights && (
          <p className="text-xs text-muted-foreground">{t("insuranceAI.noAnalyzedDocs")}</p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {insights && insights.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("insuranceAI.noIssuesFound")}</p>
        )}

        {insights && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.suggestion;
              const Icon = style.icon;
              return (
                <div key={i} className="flex gap-2 text-sm">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.color}`} />
                  <div>
                    <p className={`font-medium ${style.color}`}>{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    {insight.relatedPolicies.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {insight.relatedPolicies.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
