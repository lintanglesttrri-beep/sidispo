"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react";

interface DocumentViewerProps {
  fileUrl: string;
  fileMime: string;
  fileName: string;
}

export function DocumentViewer({
  fileUrl,
  fileMime,
  fileName,
}: DocumentViewerProps) {
  const isPdf = fileMime === "application/pdf";
  const [scale, setScale] = useState(1.1);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(isPdf);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isPdf) {
      return;
    }

    let cancelled = false;
    let pdfDoc: { destroy: () => Promise<void> } | null = null;

    async function renderPdf() {
      setLoading(true);
      setError(null);
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url: fileUrl,
          withCredentials: false,
        });
        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }
        pdfDoc = doc;
        setNumPages(doc.numPages);

        const safePage = Math.min(Math.max(1, currentPage), doc.numPages);
        const page = await doc.getPage(safePage);
        if (cancelled) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;
      } catch {
        if (!cancelled) {
          setError(
            "Dokumen PDF tidak dapat dirender di browser ini. Anda dapat mengunduhnya langsung."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      if (pdfDoc) {
        pdfDoc.destroy().catch(() => {});
      }
    };
  }, [fileUrl, isPdf, currentPage, scale]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="px-4 py-3 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-xs font-extrabold truncate max-w-[180px] sm:max-w-xs">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isPdf && numPages > 1 && (
            <div className="flex items-center bg-white/10 rounded-xl px-1.5 py-1 text-[11px] font-bold mr-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 disabled:opacity-40 hover:text-amber-400 cursor-pointer"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 tabular-nums">
                {currentPage}/{numPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(numPages, p + 1))
                }
                disabled={currentPage >= numPages}
                className="p-1 disabled:opacity-40 hover:text-amber-400 cursor-pointer"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <a
            href={`${fileUrl}?download=1`}
            className="ml-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </a>
        </div>
      </div>

      {/* Viewer Canvas / Image */}
      <div className="bg-slate-100 p-3 sm:p-5 overflow-auto max-h-[68vh] flex items-start justify-center min-h-[320px]">
        {error ? (
          <div className="p-6 text-center space-y-3 max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">{error}</p>
            <a
              href={`${fileUrl}?download=1`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Dokumen
            </a>
          </div>
        ) : isPdf ? (
          <div className="relative flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10 min-h-[240px]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Memuat dokumen PDF...</span>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="rounded-xl shadow-md bg-white max-w-none"
            />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fileUrl}
            alt={fileName}
            style={{ width: `${Math.round(scale * 100)}%`, maxWidth: "none" }}
            className="rounded-xl shadow-md bg-white object-contain"
          />
        )}
      </div>
    </div>
  );
}
