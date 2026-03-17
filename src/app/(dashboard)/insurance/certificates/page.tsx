"use client";

import { useState, useEffect } from "react";
import { Award, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

type Policy = {
  id: string;
  provider: string;
  type: string;
  policyNumber?: string;
  status: string;
};

type Document = {
  id: string;
  policyId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  parsedStatus: string;
};

export default function InsuranceCertificatesPage() {
  const t = useT();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insurance")
      .then(r => r.json())
      .then(async (pols: Policy[]) => {
        setPolicies(pols.filter(p => p.status === "active"));
        const docs: Record<string, Document[]> = {};
        await Promise.all(
          pols
            .filter(p => p.status === "active")
            .map(async (p) => {
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

  const policiesWithDocs = policies.filter(p => (documents[p.id]?.length ?? 0) > 0);
  const policiesWithoutDocs = policies.filter(p => (documents[p.id]?.length ?? 0) === 0);

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
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        {t("sidebar.certificates")}
      </h1>
      <p className="text-sm text-muted-foreground">
        Proof of coverage documents for your active insurance policies.
      </p>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Award className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No active policies found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Policies with documents */}
          {policiesWithDocs.map((policy) => {
            const docs = documents[policy.id] ?? [];
            return (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {policy.provider}
                    <Badge variant="outline" className="text-[10px]">{t(`insuranceTypes.${policy.type}`)}</Badge>
                    {policy.policyNumber && (
                      <span className="text-xs text-muted-foreground font-normal">#{policy.policyNumber}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {doc.parsedStatus === "completed" && (
                          <Badge variant="outline" className="text-[10px] text-green-700 border-green-300 shrink-0">
                            Analyzed
                          </Badge>
                        )}
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Policies without documents */}
          {policiesWithoutDocs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Missing certificates</h2>
              <div className="space-y-2">
                {policiesWithoutDocs.map((policy) => (
                  <Card key={policy.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{policy.provider}</span>
                        <Badge variant="outline" className="text-[10px]">{t(`insuranceTypes.${policy.type}`)}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">No documents uploaded</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
