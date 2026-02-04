"use client";

import { useEffect, useState } from "react";
import { FileText, RefreshCw, Download, Loader2, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Report {
  success?: boolean;
  content?: string;
  timestamp?: string;
  date?: string;
  error?: string;
}

export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/report", { method: "POST" });
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report?.content) return;
    
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-purple-400" size={28} />
          <h1 className="text-2xl font-bold">Rapport</h1>
        </div>
        <div className="flex items-center gap-2">
          {report?.content && (
            <button
              onClick={downloadReport}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
              title="Télécharger"
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                <span>Générer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timestamp */}
      {report?.timestamp && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock size={14} />
          <span>
            Dernière génération :{" "}
            {new Date(report.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-zinc-500" size={32} />
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="animate-spin text-purple-400" size={48} />
            <p className="text-zinc-400">Analyse en cours...</p>
            <p className="text-sm text-zinc-500">
              Le rapport est en train d&apos;être généré par l&apos;IA
            </p>
          </div>
        ) : report?.content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-zinc-700">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-purple-400 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-blue-400 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-zinc-300 mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-zinc-300 mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-zinc-300 mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-zinc-300">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-zinc-400 italic">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-purple-500 pl-4 my-4 text-zinc-400 italic">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-zinc-700 my-6" />,
              }}
            >
              {report.content}
            </ReactMarkdown>
          </div>
        ) : report?.error ? (
          <div className="text-center py-12 text-red-400">
            <p>Erreur : {report.error}</p>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun rapport disponible</p>
            <p className="text-sm mt-2">
              Cliquez sur &quot;Générer&quot; pour créer un nouveau rapport d&apos;analyse
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center text-xs text-zinc-600">
        Le rapport analyse le marché, les opportunités détectées et l&apos;état du portefeuille
      </div>
    </div>
  );
}
