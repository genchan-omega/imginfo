// app/waiting_check/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; 

export default function WaitingPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("ファイルデータを準備中...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false); 

  const CLOUD_FUNCTION_URL = 'https://asia-northeast1-model-generate.cloudfunctions.net/imginfo-checkimg-v2'; 

  // useCallbackフックを使用して処理関数を定義
  // 依存配列にsetStatusMessage, setErrorMessage, setShowRetryButtonを追加
  const processAllSteps = useCallback(async () => {
    // 状態をリセット
    setErrorMessage(null);
    setShowRetryButton(false);
    setStatusMessage("ファイルデータを準備中...");

    const tempFileDataUrl = sessionStorage.getItem('tempFileDataUrl');
    const uploadFileName = sessionStorage.getItem('uploadFileName');
    const uploadFileType = sessionStorage.getItem('uploadFileType');

    // ★★★ ここで取得した情報を確実にチェックする ★★★
    if (!tempFileDataUrl || !uploadFileName || !uploadFileType) {
      setErrorMessage("アップロードに必要なファイルデータが見つかりませんでした。");
      setShowRetryButton(true); 
      return; // 情報が不足している場合はここで終了
    }

    // ここでoriginalFileNameがnullでないことを保証
    // (TypeScriptの型推論がここで行われる)
    const finalOriginalFileName = uploadFileName; // 後続で確実にnullでないことを保証するため、別変数に代入
    
    // ★★★ ステータスメッセージで`originalFileName`を使用する前にnullチェックする ★★★
    setStatusMessage(`ファイルアップロード中... (${finalOriginalFileName})`); // ★修正

    let taskId: string | null = null;
    let fileExtension: string | null = null;

    try {
      // Data URLからBlobに変換
      const base64Data = tempFileDataUrl.split(',')[1];
      const mimeTypeFromUrl = tempFileDataUrl.split(',')[0].split(':')[1].split(';')[0];
      const binaryString = atob(base64Data); 
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const fileBlob = new Blob([bytes], { type: mimeTypeFromUrl });

      const fileToSend = new File([fileBlob], finalOriginalFileName, { type: uploadFileType }); // ★修正


      // ★★★ 2. Next.js API Route (`/api/upload_check`) へファイルをアップロード ★★★
      const formData = new FormData();
      formData.append("file", fileToSend); 

      const res = await fetch("/api/upload_check", { 
        method: "POST",
        body: formData, 
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorDetail = "";
        if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorDetail = errorData.error || errorData.message || "Unknown JSON error";
        } else {
            errorDetail = await res.text();
        }
        throw new Error(`API Route 呼び出しに失敗しました (Status: ${res.status}): ${errorDetail}`);
      }

      const data = await res.json();
      taskId = data.task_id;
      fileExtension = data.file_extension; 

      if (!taskId || !fileExtension) {
        throw new Error("API Routeからタスク情報が返されませんでした。");
      }
      
      // --- 2. GCSへのアップロード完了を待機し、Cloud Functionsを呼び出す ---
      setStatusMessage(`GCPと通信中... (${finalOriginalFileName}) (約3秒待機)`); // ★修正
      await new Promise(resolve => setTimeout(resolve, 3000)); // ★意図的な遅延

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
      
      setStatusMessage("結果ページへ移動中...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // 結果ページ遷移前の短い遅延
      router.replace('/result_check'); 

    } catch (error: unknown) { 
      console.error("処理中にエラー:", error);
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
    } finally {
        sessionStorage.removeItem('tempFileDataUrl');
        sessionStorage.removeItem('uploadFileName');
        sessionStorage.removeItem('uploadFileType');
    }
  }, [router, setErrorMessage, setShowRetryButton, setStatusMessage]); // routerを依存配列に追加

  useEffect(() => {
    processAllSteps();
  }, [processAllSteps]); 

  const handleRetry = () => {
    processAllSteps(); 
  };

  return (
    <main className="min-h-screen w-full relative flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">
        ②ファイルの登録と呼び出し
      </h1>
      <p className="text-lg text-gray-700">
        {statusMessage}
      </p>
      {errorMessage && (
        <p className="text-red-600 mt-4 text-center">{errorMessage}</p>
      )}
      {!showRetryButton && !errorMessage && ( 
        <div className="mt-8 animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      )}
      <p className="mt-4 text-sm text-gray-500">しばらくお待ちください</p>

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
          onClick={() => router.replace('/')}
          className="mt-4 border-2 border-gray-300 bg-gray-200 hover:bg-gray-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300"
        >
          Back to Upload Page
        </button>
      )}
    </main>
  );
}