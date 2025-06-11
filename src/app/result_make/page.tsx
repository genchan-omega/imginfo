 // app/result_make/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; 
import Image from "next/image"; // 画像表示に必要

// 3Dモデル表示のためのインポートは不要なので削除
// import { Canvas, useLoader } from '@react-three/fiber';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { OrbitControls, Environment, Text } from '@react-three/drei'; 

// 3Dモデル表示コンポーネントも不要なので削除
// function Model({ url }: { url: string }) { /* ... */ }

export default function ResultPage() {
  const router = useRouter();
  // ★imageUrlは使わないので削除、modelUrlをそのまま使う
  const [modelUrl, setModelUrl] = useState<string | null>(null); 
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false); 

  const GLTF_VIEWER_BASE_URL = "https://gltf-viewer.donmccurdy.com/";

  const loadResultData = useCallback(() => {
    setLoading(true);
    setError(null);
    setShowRetryButton(false); 

    const storedModelUrl = sessionStorage.getItem('processedModelUrl'); 
    const storedTaskId = sessionStorage.getItem('processedTaskId');

    if (storedModelUrl && storedTaskId) {
      setModelUrl(storedModelUrl);
      setTaskId(storedTaskId);
      setLoading(false);
      sessionStorage.removeItem('processedModelUrl'); 
      sessionStorage.removeItem('processedTaskId');
    } else {
      setError("結果データが見つかりませんでした。再度生成してください。"); 
      setLoading(false);
      setShowRetryButton(true); 
    }

    return () => {
      // modelUrlがObject URLである場合にのみrevokeObject
      if (storedModelUrl && storedModelUrl.startsWith('blob:')) { 
        URL.revokeObjectURL(storedModelUrl);
      }
    };
  }, []);

  useEffect(() => {
    loadResultData();
    return () => {
      const storedModelUrl = sessionStorage.getItem('processedModelUrl'); 
      if (storedModelUrl && storedModelUrl.startsWith('blob:')) { 
        URL.revokeObjectURL(storedModelUrl);
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
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-lg text-red-700">{error}</p>
          {showRetryButton && (
            <button
              onClick={handleRetry} 
              className="w-60 mt-5 border-2 border-blue-300 bg-blue-200 hover:bg-blue-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 hover:cursor-pointer"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => router.replace('/upload_make')} 
            className="w-60 mt-5 border-2 border-gray-300 bg-gray-200 hover:bg-gray-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 hover:cursor-pointer"
          >
            Back to Upload Page
          </button>

        </div>

      </main>
    );
  }

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

        {/* modelUrlがGCSの公開URLになるので、Imageコンポーネメントで表示可能。
           ただし、これはGLBファイルなので、ブラウザは直接表示しない。
           デバッグ目的で、念のためURLだけ表示。 */}
        {modelUrl ? (
          <div className="bg-blue-100 w-full border-2 border-blue-300 rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-black">生成された3DモデルのURL:</h2>
            <p className="text-sm text-gray-800 break-all mb-4">{modelUrl}</p>
            
            {/* モデルのダウンロードボタン */}
            <a
              href={modelUrl}
              download={`model-${taskId}.glb`} 
              className="mt-4 w-full border-2 border-purple-300 bg-purple-200 hover:bg-purple-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 text-center"
            >
              モデルをダウンロード (.glb)
            </a>

            {/* ★★★ Donmccurdy Viewerへのリンク ★★★ */}
            <a
              href={`${GLTF_VIEWER_BASE_URL}#model=${encodeURIComponent(modelUrl)}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 w-full border-2 border-yellow-300 bg-yellow-200 hover:bg-yellow-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 text-center"
            >
              Donmccurdy Viewerで確認
            </a>

            <p className="text-sm text-gray-600 mt-4">3Dモデルのリンクが受信されました。</p>
          </div>
        ) : (
          <p className="text-lg text-gray-600">
            3Dモデルのリンクは受信されませんでした．<br />
            もう一度お試しください
          </p>
        )}

        <button
          onClick={() => router.replace('/upload_make')} 
          className="mt-8 border-2 border-cyan-300 bg-rose-200 hover:bg-rose-400 hover:-translate-y-1 text-gray-700 font-bold px-6 py-3 rounded-lg transition duration-300"
        >
          もう一度3Dモデルを生成
        </button>
      </div>
    </main>
  );
}