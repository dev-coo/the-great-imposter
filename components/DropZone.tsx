"use client";

import { useCallback, useRef, useState } from "react";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_WIDTH = 400;

interface Props {
  onFileSelected: (file: File, dataUrl: string, width: number, height: number) => void;
}

export function DropZone({ onFileSelected }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      setError(null);
      if (!ALLOWED_MIME.includes(file.type)) {
        setError("PNG, JPEG, WebP 형식만 지원해요.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("파일이 너무 커요 (최대 10MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth < MIN_WIDTH) {
            setError(`이미지 가로가 ${MIN_WIDTH}px 이상이어야 해요.`);
            return;
          }
          onFileSelected(file, dataUrl, img.naturalWidth, img.naturalHeight);
        };
        img.onerror = () => setError("이미지를 읽을 수 없어요.");
        img.src = dataUrl;
      };
      reader.onerror = () => setError("파일을 읽을 수 없어요.");
      reader.readAsDataURL(file);
    },
    [onFileSelected],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateAndEmit(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          dragOver ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <p className="text-lg font-medium text-gray-700">사진을 끌어다 놓으세요</p>
        <p className="text-sm text-gray-500 mt-2">또는 클릭해서 선택 (PNG/JPEG/WebP, 최대 10MB)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndEmit(file);
          }}
        />
      </div>
      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
}
