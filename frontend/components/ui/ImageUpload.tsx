'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadsService } from '@/services/uploads';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/format';

type Props = {
  folder: 'goats' | 'kids';
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({ folder, value, onChange, disabled, className }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file || disabled) return;
    setUploading(true);
    try {
      const result = await uploadsService.uploadImage(file, folder);
      onChange(result.url);
      toast('Photo uploaded');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-foreground">Photo</p>
      {value ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Animal" className="h-40 w-40 object-cover" />
          {!disabled && (
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-fg transition hover:bg-muted disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {uploading ? 'Uploading…' : 'Add photo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
    </div>
  );
}
