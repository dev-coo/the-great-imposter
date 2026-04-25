"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";
import { ResultView } from "@/components/ResultView";
import { AnalyzeResponse, ImposterPoint } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "loading"; imageDataUrl: string }
  | {
      kind: "result";
      imageDataUrl: string;
      width: number;
      height: number;
      points: ImposterPoint[];
    }
  | { kind: "reject"; imageDataUrl: string; reason: string };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const handleFile = async (
    file: File,
    dataUrl: string,
    width: number,
    height: number,
  ) => {
    setState({ kind: "loading", imageDataUrl: dataUrl });

    const base64 = dataUrl.split(",")[1] ?? "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.ok) {
        setState({
          kind: "result",
          imageDataUrl: dataUrl,
          width,
          height,
          points: data.points,
        });
      } else {
        setState({ kind: "reject", imageDataUrl: dataUrl, reason: data.reason });
      }
    } catch {
      setState({
        kind: "reject",
        imageDataUrl: dataUrl,
        reason: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      });
    }
  };

  const reset = () => setState({ kind: "idle" });

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">The Great Imposter</h1>
      <p className="text-center text-gray-600 mb-12">
        사진을 올리면 임포스터가 몰래 숨어듭니다.
      </p>

      {state.kind === "idle" && <DropZone onFileSelected={handleFile} />}

      {state.kind === "loading" && (
        <div className="max-w-2xl mx-auto text-center">
          <img
            src={state.imageDataUrl}
            alt="업로드한 이미지"
            className="rounded-xl mx-auto opacity-60"
          />
          <p className="mt-6 text-lg text-gray-700">임포스터 잠입 중…</p>
        </div>
      )}

      {state.kind === "result" && (
        <ResultView
          imageDataUrl={state.imageDataUrl}
          imageWidth={state.width}
          imageHeight={state.height}
          points={state.points}
          onReset={reset}
        />
      )}

      {state.kind === "reject" && (
        <div className="max-w-2xl mx-auto text-center">
          <img
            src={state.imageDataUrl}
            alt="업로드한 이미지"
            className="rounded-xl mx-auto"
          />
          <p className="mt-6 text-lg text-gray-700">{state.reason}</p>
          <button
            onClick={reset}
            className="mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
          >
            다른 사진 시도
          </button>
        </div>
      )}
    </main>
  );
}
