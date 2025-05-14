// src/app/page.tsx

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  
  const handleUpload = async() => {
    if(!file)
        return;

    const formData = new FormData();
    formData.append('file', file);

    // Flaskのエンドポイントへアップロード
    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const { task_id } = await res.json(); // 処理IDを取得
      router.push(`/processing?task_id=${task_id}`);
    } else {
      alert('アップロード失敗');
    }
  };
  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg.png"
        alt=""
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-fuchsia-600">
          3Dモデル生成サイト
        </h1>
        <p className="w-60 p-2">
          数枚の写真を撮ることで，簡単にかわいい3Dモデルを生成するサイトです．
        </p>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button
          className="border-2 p-2 hover:cursor-pointer z-1"
          onClick={handleUpload}
        >
          Upload File
        </button>
      </div>
    </main>
  );
}
