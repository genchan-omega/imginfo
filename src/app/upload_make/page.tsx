// app/upload_make/page.tsx

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ表示用

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("ファイルを選択してください"); 
      return;
    }

    setErrorMessage(null); 

    let taskId: string | null = null;
    let fileExtension: string | null = null; 

    try {
      // --- 1. まずファイルを Next.js のAPIルート (`/api/upload`) に送信 ---
      const formData = new FormData();
      formData.append("file", file); // 実際のファイルをFormDataに追加

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData, 
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP Status ${res.status}: ${res.statusText}` }));
        const errorMessage = errorData.message || (await res.text()).substring(0, 200) + '...';
        throw new Error(`API Route 呼び出しに失敗しました: ${errorMessage}`);
      }

      // API RouteからのJSONレスポンスを解析
      const data = await res.json();
      console.log("Next.js API Route からの応答:", data);

      // taskIdとfile_extensionを取得し、存在チェック
      taskId = data.task_id;
      fileExtension = data.file_extension; 

      if (!taskId) { throw new Error("API Routeからtask_idが返されませんでした。"); }
      if (!fileExtension) { throw new Error("API Routeからfile_extensionが返されませんでした。"); }
      console.log(`API Route 成功。Task ID: ${taskId}, Extension: ${fileExtension}`);
      
      // ★★★ ここにsessionStorageへの保存を追加 ★★★
      sessionStorage.setItem('lastUploadedTaskId', taskId);
      sessionStorage.setItem('lastUploadedFileExtension', fileExtension);
      sessionStorage.setItem('uploadFileName', file.name); // 元のファイル名も保存

      router.push('/waiting'); // waitingページへ遷移
      
    } catch (error: unknown) { // ★★★ 'any' を 'unknown' に変更 ★★★
      console.error("ファイルアップロードエラー:", error);
      // エラーオブジェクトの型ガード
      let msg = "不明なエラーが発生しました。";
      if (error instanceof Error) { // Error型の場合
        msg = error.message;
      } else if (typeof error === 'string') { // 文字列の場合
        msg = error;
      } else if (typeof error === 'object' && error !== null && 'message' in error) { // オブジェクトでmessageプロパティを持つ場合
        msg = (error as { message: string }).message;
      }
      setErrorMessage(`エラーが発生しました: ${msg}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setErrorMessage(null); 
  };

  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg_upload.png"
        alt=""
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold">
          ①ファイルをアップロードしてください
        </h1>
        <div className="w-103 flex flex-col items-center gap-5">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <span className="w-full text-center text-sm text-gray-600 bg-white p-2 rounded-xl border-2 border-black">
            {file ? `選択されたファイル: ${file.name}` : "ファイルが選択されていません"}
          </span>
          <div className="flex gap-3">
            <button
              className="w-50 border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
              onClick={() => fileInputRef.current?.click()}
            >
              ファイルを選択
            </button>
            <button
              onClick={handleUpload}
              className="w-50 border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
            >
              通信開始
            </button>
          </div>
        </div>
        {errorMessage && (
          <p className="text-red-600 mt-4 text-center">{errorMessage}</p>
        )}
      </div>
    </main>
  );
}