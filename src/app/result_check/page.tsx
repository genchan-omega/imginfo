// app/result_check/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; 
import Image from "next/image"; 

export default function ResultPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false); 

  const loadResultData = useCallback(() => {
    setLoading(true);
    setError(null);
    setShowRetryButton(false); 

    const storedImageUrl = sessionStorage.getItem('processedImageUrl');
    const storedTaskId = sessionStorage.getItem('processedTaskId');

    if (storedImageUrl && storedTaskId) {
      setImageUrl(storedImageUrl);
      setTaskId(storedTaskId);
      setLoading(false);
      sessionStorage.removeItem('processedImageUrl');
      sessionStorage.removeItem('processedTaskId');
    } else {
      setError("結果データが見つかりませんでした。再度アップロードしてください。");
      setLoading(false);
      setShowRetryButton(true); 
    }

    return () => {
      if (storedImageUrl) {
        URL.revokeObjectURL(storedImageUrl);
      }
    };
  }, []);

  useEffect(() => {
    loadResultData();
    return () => {
      const storedImageUrl = sessionStorage.getItem('processedImageUrl'); 
      if (storedImageUrl) { 
        URL.revokeObjectURL(storedImageUrl);
      }
    };
  }, [loadResultData]); 

  const handleRetry = () => {
    loadResultData();
    console.log("here")
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full relative flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">結果を読み込み中...</h1>
        <div className="mt-8 animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </main>
    );
  }

  // 画像の読み取りに失敗した時
  if (error) {
    return (
      <main className="min-h-screen w-full relative">
        <Image
          src="/bg_error.png"
          alt="error background"
          fill
          className="-z-1 object-cover opacity-40"
          priority
        />
        
        <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-black bg-white rounded-xl px-5 py-2 border-4 border-black">
          動作確認結果
        </h1>
          <p className="text-red-700 bg-white rounded-xl px-5 py-2 border-4 border-black mt-3">{error}</p>
          {showRetryButton && (
            <button
              onClick={handleRetry} 
              className="w-60 mt-5 border-2 border-blue-300 bg-blue-200 hover:bg-blue-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 hover:cursor-pointer"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => router.replace('/')}
            className="w-60 mt-5 border-2 border-gray-300 bg-gray-200 hover:bg-gray-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 hover:cursor-pointer"
          >
            Back to Index Page
          </button>

        </div>

      </main>
    );
  }

  // 画像の読み取りに成功した時
  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg_success.png"
        alt=""
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="min-h-screen w-150 mx-auto flex flex-col gap-2 items-center justify-center">
        <h1 className="text-3xl font-bold text-black">
          動作確認結果
        </h1>
        {taskId && (
          <div className="bg-white w-full p-2 rounded-lg shadow-md text-center text-black">
            <h2 className="text-xl font-semibold mb-2">タスクID:</h2>
            <p className="text-lg font-mono break-all">{taskId}</p>
          </div>
        )}

        {imageUrl ? (
          <div className="bg-blue-100 w-full border-2 border-blue-300 rounded-lg p-6 flex flex-col items-center">
            <Image
              width={500}
              height={500}
              src={imageUrl}
              alt="Received from Cloud Functions" 
              className="max-w-full h-auto rounded-md border border-gray-300"
            />
            <p className="text-sm text-gray-600 mt-4">正常に画像データが受信されました．</p>
          </div>
        ) : (
          <p className="text-lg text-gray-600">
            画像は受信されませんでした．<br />
            もう一度お試しください
          </p>
        )}

        <button
          onClick={() => router.replace('/')}
          className="mt-8 border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-6 py-3 rounded-lg transition duration-300"
        >
          Back to Index Page
        </button>
      </div>
    </main>
  );
}