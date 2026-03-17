"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Upload, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

type Policy = {
  id: string;
  provider: string;
  type: string;
};

type Document = {
  id: string;
  policyId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  parsedStatus: string;
  analysisResult?: any;
};

export default function InsuranceFilesPage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insurance")
      .then(r => r.json())
      .then(async (pols: Policy[]) => {
        setPolicies(pols);
        const docs: Record<string, Document[]> = {};
        await Promise.all(
          pols.map(async (p) => {
            try {
              const res = await fetch(`/api/insurance/${p.id}/documents`);
              if (res.ok) docs[p.id] = await res.json();
            } catch {}
          })
        );
        setDocuments(docs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpload(policyId: string, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("insuranceDocuments.fileTooLarge"));
      return;
    }
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error(t("insuranceDocuments.invalidType"));
      return;
    }
    setUploading(policyId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("policyId", policyId);
    try {
      const res = await fetch("/api/insurance/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const doc = await res.json();
      setDocuments(prev => ({
        ...prev,
        [policyId]: [...(prev[policyId] ?? []), doc],
      }));
      toast.success("Document uploaded");
    } catch {
      toast.error(t("insuranceDocuments.uploadFailed"));
    }
    setUploading(null);
  }

  async function handleAnalyze(policyId: string, docId: string) {
    setAnalyzing(docId);
    try {
      const res = await fetch(`/api/insurance/${policyId}/documents/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("insuranceAI.analysisComplete"));
      // Refresh docs for this policy
      const docsRes = await fetch(`/api/insurance/${policyId}/documents`);
      if (docsRes.ok) {
        const updatedDocs = await docsRes.json();
        setDocuments(prev => ({ ...prev, [policyId]: updatedDocs }));
      }
    } catch {
      toast.error(t("insuranceAI.analysisFailed"));
    }
    setAnalyzing(null);
  }

  async function handleAnalyzeAll() {
    setAnalyzing("all");
    try {
      const res = await fetch("/api/insurance/analyze-all", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Batch analysis started");
      // Refresh all docs
      const pols = policies;
      const docs: Record<string, Document[]> = {};
      await Promise.all(
        pols.map(async (p) => {
          try {
            const r = await fetch(`/api/insurance/${p.id}/documents`);
            if (r.ok) docs[p.id] = await r.json();
          } catch {}
        })
      );
      setDocuments(docs);
    } catch {
      toast.error(t("toast.error"));
    }
    setAnalyzing(null);
  }

  const allDocs = policies.flatMap(p => (documents[p.id] ?? []).map(d => ({ ...d, policy: p })));
  const pendingCount = allDocs.filter(d => d.parsedStatus === "pending").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          {t("sidebar.files")}
        </h1>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyzeAll}
            disabled={analyzing === "all"}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {analyzing === "all" ? t("insuranceAI.analyzing") : `Analyze all (${pendingCount})`}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {allDocs.length} document{allDocs.length !== 1 ? "s" : ""} across {policies.length} policies
      </p>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Add insurance policies first to upload documents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {policies.map((policy) => {
            const policyDocs = documents[policy.id] ?? [];
            return (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {policy.provider}
                      <Badge variant="outline" className="text-[10px]">{t(`insuranceTypes.${policy.type}`)}</Badge>
                    </span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(policy.id, file);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        disabled={uploading === policy.id}
                      >
                        <span>
                          <Upload className="h-3.5 w-3.5 mr-1" />
                          {uploading === policy.id ? t("insuranceDocuments.uploading") : t("insuranceDocuments.upload")}
                        </span>
                      </Button>
                    </label>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {policyDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("insuranceDocuments.noDocuments")}</p>
                  ) : (
                    <div className="space-y-2">
                      {policyDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline truncate block"
                            >
                              {doc.fileName}
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {doc.parsedStatus === "completed" ? (
                            <Badge variant="outline" className="text-[10px] text-green-700 border-green-300">
                              {t("insuranceAI.analysisComplete")}
                            </Badge>
                          ) : doc.parsedStatus === "failed" ? (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              {t("insuranceAI.analysisFailed")}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleAnalyze(policy.id, doc.id)}
                              disabled={analyzing === doc.id}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              {analyzing === doc.id ? t("insuranceAI.analyzing") : t("insuranceAI.analyze")}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
