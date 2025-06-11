// app/upload_check/page.tsx

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

    try {
      // FileReaderを使ってファイルの内容をData URLとして非同期に読み込む
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') { // reader.resultはstring (Data URL) または ArrayBuffer
          sessionStorage.setItem('tempFileDataUrl', reader.result); // Data URLをsessionStorageに保存
          sessionStorage.setItem('uploadFileName', file.name); // ファイル名も保存
          sessionStorage.setItem('uploadFileType', file.type); // ファイルタイプも保存
          
          router.push('/waiting_make'); // ★すぐにwaiting_checkページへ遷移 ★
        } else {
          setErrorMessage("ファイルの読み込み中にエラーが発生しました。");
        }
      };
      reader.onerror = () => {
        setErrorMessage("ファイルの読み込みに失敗しました。");
      };
      reader.readAsDataURL(file); // ファイルをData URLとして読み込む
      
    } catch (error: unknown) { // 'unknown' 型のエラーハンドリング
      let msg = "不明なエラーが発生しました。";
      if (error instanceof Error) { 
        msg = error.message;
      } else if (typeof error === 'string') { 
        msg = error;
      } else if (typeof error === 'object' && error !== null && 'message' in error) { 
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