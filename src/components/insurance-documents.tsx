"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Trash2, Download, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { format } from "date-fns";

type AnalysisResult = {
  coverageType?: string;
  coveredItems?: string[];
  deductible?: string | null;
  coverageLimits?: string | null;
  exclusions?: string[];
  effectiveDates?: { start: string; end: string } | null;
  keyTerms?: string[];
  summary?: string;
};

type Document = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  parsedStatus?: string;
  analysisResult?: AnalysisResult | null;
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

export function InsuranceDocuments({ policyId, documents: initial, onUpdate }: {
  policyId: string;
  documents: Document[];
  onUpdate: () => void;
}) {
  const t = useT();
  const [documents, setDocuments] = useState<Document[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync internal state when parent passes new documents (e.g. switching policy)
  useEffect(() => {
    setDocuments(initial);
  }, [initial]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (file.size > MAX_SIZE) {
      setError(t("insuranceDocuments.fileTooLarge"));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("insuranceDocuments.invalidType"));
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/insurance/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error();
      const { fileUrl, fileName, fileType } = await uploadRes.json();

      // Create document record
      const docRes = await fetch(`/api/insurance/${policyId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, fileName, fileType }),
      });
      if (!docRes.ok) throw new Error();
      const newDoc = await docRes.json();
      setDocuments((prev) => [...prev, newDoc]);
      onUpdate();
    } catch {
      setError(t("insuranceDocuments.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleAnalyze(docId: string) {
    setAnalyzingId(docId);
    setError("");

    // Optimistically update status
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, parsedStatus: "processing" } : d))
    );

    try {
      const res = await fetch(`/api/insurance/${policyId}/documents/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("insuranceAI.analysisFailed"));
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, parsedStatus: "failed" } : d))
        );
        return;
      }

      const updated = await res.json();
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, parsedStatus: updated.parsedStatus, analysisResult: updated.analysisResult } : d))
      );
      setExpandedId(docId);
      onUpdate();
    } catch {
      setError(t("insuranceAI.analysisFailed"));
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, parsedStatus: "failed" } : d))
      );
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleDelete(docId: string) {
    const res = await fetch(`/api/insurance/${policyId}/documents?docId=${docId}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      onUpdate();
    }
  }

  function statusBadge(status?: string) {
    switch (status) {
      case "processing":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 animate-pulse">{t("insuranceAI.analyzing")}</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300">{t("insuranceAI.analysisComplete")}</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-300">{t("insuranceAI.analysisFailed")}</Badge>;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("insuranceDocuments.title")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? t("insuranceDocuments.uploading") : t("insuranceDocuments.upload")}
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("insuranceDocuments.noDocuments")}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-md">
              <div className="flex items-center justify-between gap-2 text-sm px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{doc.fileName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground">{format(new Date(doc.uploadedAt), "d MMM yyyy")}</p>
                      {statusBadge(doc.parsedStatus)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {doc.parsedStatus !== "completed" && doc.parsedStatus !== "processing" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600"
                      disabled={analyzingId !== null}
                      onClick={() => handleAnalyze(doc.id)}
                      title={t("insuranceAI.analyze")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {doc.parsedStatus === "completed" && doc.analysisResult && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    >
                      {expandedId === doc.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Analysis result panel */}
              {expandedId === doc.id && doc.analysisResult && (
                <AnalysisPanel analysis={doc.analysisResult} t={t} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisPanel({ analysis, t }: { analysis: AnalysisResult; t: (key: string) => string }) {
  return (
    <div className="border-t bg-muted/30 px-3 py-3 space-y-2 text-xs">
      {analysis.summary && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.summary")}</p>
          <p className="text-muted-foreground">{analysis.summary}</p>
        </div>
      )}
      {analysis.coveredItems && analysis.coveredItems.length > 0 && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.coveredItems")}</p>
          <p className="text-muted-foreground">{analysis.coveredItems.join(", ")}</p>
        </div>
      )}
      {analysis.deductible && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.deductible")}</p>
          <p className="text-muted-foreground">{analysis.deductible}</p>
        </div>
      )}
      {analysis.coverageLimits && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.coverageLimits")}</p>
          <p className="text-muted-foreground">{analysis.coverageLimits}</p>
        </div>
      )}
      {analysis.exclusions && analysis.exclusions.length > 0 && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.exclusions")}</p>
          <p className="text-muted-foreground">{analysis.exclusions.join(", ")}</p>
        </div>
      )}
      {analysis.keyTerms && analysis.keyTerms.length > 0 && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.keyTerms")}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {analysis.keyTerms.map((term) => (
              <Badge key={term} variant="secondary" className="text-[10px]">{term}</Badge>
            ))}
          </div>
        </div>
      )}
      {analysis.effectiveDates && (
        <div>
          <p className="font-medium text-foreground mb-0.5">{t("insuranceAI.effectiveDates")}</p>
          <p className="text-muted-foreground">{analysis.effectiveDates.start} — {analysis.effectiveDates.end}</p>
        </div>
      )}
    </div>
  );
}
