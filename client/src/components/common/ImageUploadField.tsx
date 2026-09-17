import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  required?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedDataUrl);
      };

      reader.readAsDataURL(file);
    });
  };

  const uploadToSupabaseStorage = async (file: File): Promise<string | null> => {
    const supabaseUrl =
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) return null;

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      const uploadEndpoint = `${cleanUrl}/storage/v1/object/posters/${fileName}`;

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: file,
      });

      if (res.ok) {
        return `${cleanUrl}/storage/v1/object/public/posters/${fileName}`;
      }
    } catch {
      // Fallback to canvas compression if Supabase bucket fails
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (.jpg, .png, .webp, .svg)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Attempt direct Supabase Storage Upload
      const storageUrl = await uploadToSupabaseStorage(file);
      if (storageUrl) {
        onChange(storageUrl);
        setIsUploading(false);
        return;
      }

      // 2. Fallback to canvas-compressed lightweight image string (<100KB payload)
      const compressedUrl = await compressImage(file);
      onChange(compressedUrl);
    } catch {
      setError('Failed to process image file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Image Loaded
          </span>
        )}
      </div>

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/60 p-2">
          <div className="relative h-44 w-full rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center">
            <img
              src={value}
              alt="Uploaded Preview"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-white/90 dark:bg-zinc-800/90 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-bold shadow-lg hover:scale-105 transition-all"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-xl bg-rose-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg hover:bg-rose-500 hover:scale-105 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/60 dark:bg-zinc-900/30'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-2">
            {isUploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {isUploading ? 'Uploading & Optimizing Banner...' : 'Click to upload or drag & drop photo'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
            PNG, JPG, WebP up to 10MB (Direct Storage Upload)
          </p>
        </div>
      )}

      {/* Direct URL input option */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Or paste external image URL (https://...)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">{helperText}</p>
      )}
    </div>
  );
};
