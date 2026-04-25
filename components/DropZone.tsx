"use client";

import { useCallback, useRef, useState } from "react";
import { UploadIcon, ImageIcon, CloseIcon } from "./Icons";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_WIDTH = 400;

interface FileInfo {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

interface Props {
  onFileSelected: (file: File, dataUrl: string, width: number, height: number) => void;
}

export function DropZone({ onFileSelected }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<FileInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
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
          setSelected({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => setError("이미지를 읽을 수 없어요.");
        img.src = dataUrl;
      };
      reader.onerror = () => setError("파일을 읽을 수 없어요.");
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleStart = () => {
    if (selected) {
      onFileSelected(selected.file, selected.dataUrl, selected.width, selected.height);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // File selected state
  if (selected) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 16 }}>
          <div className="gi-display" style={{ fontSize: 26, color: "var(--gi-fg)", marginBottom: 6 }}>
            준비 완료
          </div>
          <div style={{ color: "var(--gi-fg-2)", fontSize: 14 }}>
            이 사진으로 시작해 볼까요?
          </div>
        </div>

        {/* Preview */}
        <div style={{
          position: "relative",
          border: "1px solid var(--gi-line)",
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "4/3",
          background: "var(--gi-bg-3)",
        }}>
          <img
            src={selected.dataUrl}
            alt="미리보기"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <div className="gi-chip">
              <ImageIcon size={12} />
              미리보기
            </div>
          </div>
        </div>

        {/* File row */}
        <div style={{
          marginTop: 12,
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px", paddingRight: 8,
          background: "var(--gi-bg-3)",
          border: "1px solid var(--gi-line)",
          borderRadius: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
            background: "rgba(70,225,225,0.1)",
            border: "1px solid rgba(70,225,225,0.25)",
            color: "var(--gi-cyan)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ImageIcon size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--gi-fg)", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.file.name}
            </div>
            <div style={{ color: "var(--gi-fg-3)", fontSize: 11, fontFamily: "var(--gi-font-mono)", marginTop: 2 }}>
              {selected.width}×{selected.height} · {formatSize(selected.file.size)}
            </div>
          </div>
          <button
            onClick={() => { setSelected(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="gi-btn gi-btn-icon"
            style={{ width: 32, height: 32, borderRadius: 8 }}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <button onClick={handleStart} className="gi-btn gi-btn-primary gi-size-lg" style={{ width: "100%" }}>
            <SearchIcon size={18} />
            임포스터 숨기기 시작
          </button>
          <button
            onClick={() => { setSelected(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="gi-btn gi-btn-ghost gi-size-md"
            style={{ width: "100%" }}
          >
            다른 사진 고르기
          </button>
        </div>
      </div>
    );
  }

  // Drag over state
  if (dragOver) {
    return (
      <div
        style={{ width: "100%" }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateFile(file);
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div className="gi-display" style={{ fontSize: 28, color: "var(--gi-fg)", marginBottom: 8 }}>
            놓으면 시작!
          </div>
          <div style={{ color: "var(--gi-fg-2)", fontSize: 14 }}>
            여기에 떨어뜨려 주세요.
          </div>
        </div>
        <div className="gi-drop gi-drop-over" style={{ padding: "60px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((p) => {
            const pos = {
              tl: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
              tr: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
              bl: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
              br: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
            }[p];
            return (
              <div
                key={p}
                style={{
                  position: "absolute", width: 18, height: 18,
                  borderColor: "var(--gi-cyan)", borderStyle: "solid", borderWidth: 0,
                  animation: "gi-bracket-pulse 1.4s ease-in-out infinite",
                  ...pos,
                }}
              />
            );
          })}
          <div style={{
            width: 64, height: 64, margin: "0 auto 18px",
            borderRadius: 16,
            background: "var(--gi-cyan)", color: "#042020",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--gi-glow-cyan)",
          }}>
            <UploadIcon size={28} />
          </div>
          <div style={{ color: "var(--gi-fg)", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
            잘 잡았어요
          </div>
          <div style={{ color: "var(--gi-cyan)", fontSize: 14, fontFamily: "var(--gi-font-mono)", letterSpacing: "0.1em" }}>
            DROP TO UPLOAD
          </div>
        </div>
      </div>
    );
  }

  // Default idle state
  return (
    <div style={{ width: "100%" }}>
      <div
        className="gi-drop"
        style={{ padding: "36px 20px", textAlign: "center" }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div style={{
          width: 56, height: 56, margin: "0 auto 16px",
          borderRadius: 14,
          background: "rgba(70,225,225,0.08)",
          border: "1px solid rgba(70,225,225,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--gi-cyan)",
        }}>
          <UploadIcon size={24} />
        </div>
        <div style={{ color: "var(--gi-fg)", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
          사진을 끌어다 놓거나 탭하기
        </div>
        <div style={{ color: "var(--gi-fg-3)", fontSize: 12, fontFamily: "var(--gi-font-mono)", letterSpacing: "0.04em" }}>
          PNG · JPEG · WEBP &nbsp;·&nbsp; 최대 10MB &nbsp;·&nbsp; 너비 ≥ 400px
        </div>
        <button
          className="gi-btn gi-btn-primary gi-size-md"
          style={{ marginTop: 18 }}
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <ImageIcon size={16} />
          사진 선택하기
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateFile(file);
          }}
        />
      </div>

      {error && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "rgba(255,90,110,0.08)",
          border: "1px solid rgba(255,90,110,0.3)",
          borderRadius: 12,
          color: "var(--gi-err)", fontSize: 13, textAlign: "center",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
