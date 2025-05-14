// app/upload/page.tsx

"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { task_id } = await res.json();
      router.push(`/processing?task_id=${task_id}`);
    } else {
      alert("アップロードに失敗しました。");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
  };

  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg_2.png"
        alt=""
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">①ファイルをアップロードしてください</h1>

        {/* ファイル選択 UI */}
        <div className="flex flex-col items-center space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <span className="text-sm text-gray-600 bg-white p-2 rounded-xl border-2 border-black">
            {file ? `選択されたファイル: ${file.name}` : "ファイルが選択されていません"}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            className="border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
            onClick={() => fileInputRef.current?.click()}
          >
            ファイルを選択
          </button>
          <button
            onClick={handleUpload}
            className="border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
            disabled={!file}
          >
            アップロード
          </button>
        </div>
      </div>
    </main>
  );
}
