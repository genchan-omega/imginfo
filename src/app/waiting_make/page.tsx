// app/waiting_make/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; 

export default function WaitingPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("ファイルをアップロード中...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false); 

  const CLOUD_FUNCTION_URL = 'https://asia-northeast1-model-generate.cloudfunctions.net/model_generate_v2'; 

  const processUpload = useCallback(async () => {
    setErrorMessage(null);
    setShowRetryButton(false);
    setStatusMessage("ファイルをアップロード中...");

    const taskId = sessionStorage.getItem('lastUploadedTaskId');
    const fileExtension = sessionStorage.getItem('lastUploadedFileExtension');
    const originalFileName = sessionStorage.getItem('uploadFileName'); 

    if (!taskId || !fileExtension || !originalFileName) {
      setErrorMessage("ファイルアップロード情報が見つかりませんでした。");
      setShowRetryButton(true); 
      return;
    }

    setStatusMessage(`GCPにファイルを登録中... (${originalFileName}) (約5秒待機中)`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    setStatusMessage(`GCPと通信中... (${originalFileName})`);

    try {
      const cfRes = await fetch(CLOUD_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId: taskId, fileExtension: fileExtension }),
      });

      if (!cfRes.ok) {
        const contentType = cfRes.headers.get("content-type");
        let errorDetail = "";
        if (contentType && contentType.includes("application/json")) {
            const errorData = await cfRes.json();
            errorDetail = errorData.error || errorData.message || "Unknown JSON error";
        } else {
            errorDetail = await cfRes.text();
        }
        throw new Error(`Cloud Functions 呼び出しに失敗しました (Status: ${cfRes.status}): ${errorDetail}`);
      }

      const imageBlob = await cfRes.blob();
      const imageUrl = URL.createObjectURL(imageBlob); 

      sessionStorage.setItem('processedImageUrl', imageUrl);
      sessionStorage.setItem('processedTaskId', taskId);
      
      setStatusMessage("処理完了！結果ページへ移動中...");
      router.replace('/result'); 

    } catch (error: unknown) { 
      console.error("Cloud Functions 処理中にエラー:", error);
      let msg = "処理中に予期せぬエラーが発生しました。";
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'string') {
        msg = error;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        msg = (error as { message: string }).message;
      }
      setErrorMessage(msg);
      setStatusMessage("エラーが発生しました。");
      setShowRetryButton(true); 
    }
  }, [router]);

  useEffect(() => {
    processUpload();
  }, [processUpload]); 

  const handleRetry = () => {
    processUpload(); 
  };

  return (
    <main className="min-h-screen w-full relative flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">
        ②ファイルのアップロード中...
      </h1>
      <p className="text-lg text-gray-700">
        {statusMessage}
      </p>
      {/* error message  */}
      {errorMessage && (
        <p className="text-red-600 mt-4 text-center">{errorMessage}</p>
      )}
      {/* loadingっぽいやつ */}
      {!showRetryButton && !errorMessage && ( 
        <div className="mt-8 animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      )}
      <p className="mt-4 text-sm text-gray-500">しばらくお待ちください。</p>

      {/* uploadに失敗したとき */}
      {showRetryButton && (
        <button
          onClick={handleRetry} 
          className="mt-8 border-2 border-blue-300 bg-blue-200 hover:bg-blue-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
        >
          Retry
        </button>
      )}
      {showRetryButton && ( 
        <button
          onClick={() => router.replace('/upload')}
          className="mt-4 border-2 border-gray-300 bg-gray-200 hover:bg-gray-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
        >
          Back to Upload Page
        </button>
      )}
    </main>
  );
}