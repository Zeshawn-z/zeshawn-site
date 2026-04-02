"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2, X, ImageIcon } from "lucide-react";
import type { ImageItem } from "./types";

export default function ImagesManager() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ImageItem | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ deleted: number } | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/images");
      const data = await res.json();
      setImages(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const deleteOne = async (id: string) => {
    if (!confirm("确定删除这张图片？如果有文章正在引用，将导致图片无法显示。")) return;
    await fetch(`/api/admin/images?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setImages(images.filter((img) => img.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  const cleanupUnused = async () => {
    if (!confirm("将扫描博客、笔记与站点配置（含头像/Logo）引用，删除未被使用的图片。确定继续？")) return;
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch("/api/admin/images?action=cleanup", { method: "POST" });
      const data = await res.json();
      setCleanResult({ deleted: data.deleted });
      await loadImages();
    } catch {
      // ignore
    } finally {
      setCleaning(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          共 {images.length} 张图片
          {images.length > 0 && (
            <span className="ml-1">
              · 总大小 {formatSize(images.reduce((sum, img) => sum + img.size, 0))}
            </span>
          )}
        </p>
        <button
          onClick={cleanupUnused}
          disabled={cleaning}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:opacity-50"
        >
          {cleaning ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          清理未使用
        </button>
      </div>

      {/* Clean result toast */}
      {cleanResult && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-2.5 text-sm">
          {cleanResult.deleted > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              已清理 {cleanResult.deleted} 张未使用的图片
            </span>
          ) : (
            <span className="text-muted">所有图片都在使用中，无需清理</span>
          )}
        </div>
      )}

      {/* Image grid */}
      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <ImageIcon size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">暂无图片</p>
          <p className="mt-1 text-xs text-muted">在博客编辑器中上传的图片会显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              <button onClick={() => setPreview(img)} className="block w-full">
                <div className="relative aspect-square overflow-hidden bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${img.id}`}
                    alt={img.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </button>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium" title={img.filename}>{img.filename}</p>
                <p className="text-xs text-muted">{formatSize(img.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteOne(img.id); }}
                className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                title="删除"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            >
              <X size={16} />
            </button>
            <div className="max-h-[75vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${preview.id}`}
                alt={preview.filename}
                className="block max-w-full"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{preview.filename}</p>
                <p className="text-xs text-muted">
                  {formatSize(preview.size)} · {preview.mimeType} · {new Date(preview.createdAt + "Z").toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(`/api/images/${preview.id}`); }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
                >
                  复制链接
                </button>
                <button
                  onClick={() => deleteOne(preview.id)}
                  className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-500 transition-colors hover:bg-red-500/10"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
