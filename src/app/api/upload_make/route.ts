// app/api/upload_make/route.ts

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';

// --- DEBUG: 環境変数の内容をサーバーサイドのターミナルに出力 ---
console.log("--- DEBUG: process.env CONTENT for API Route ---");
console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
console.log("process.env.GCS_BUCKET_NAME_MAKE:", process.env.GCS_BUCKET_NAME_MAKE);
console.log("process.env.GCP_PROJECT_ID:", process.env.GCP_PROJECT_ID);
console.log("process.env.GCP_CLIENT_EMAIL:", process.env.GCP_CLIENT_EMAIL ? "SET" : "NOT SET");
console.log("process.env.GCP_PRIVATE_KEY:", process.env.GCP_PRIVATE_KEY ? "SET (length: " + process.env.GCP_PRIVATE_KEY.length + ")" : "NOT SET");
console.log("--- END DEBUG ---");


// Google Cloud Storage の設定
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const GCS_BUCKET_NAME_MAKE = process.env.GCS_BUCKET_NAME_MAKE;

// 環境変数が不足している場合のチェック
if (!GCS_BUCKET_NAME_MAKE || !process.env.GCP_PROJECT_ID || !process.env.GCP_CLIENT_EMAIL || !process.env.GCP_PRIVATE_KEY) {
  console.error('CRITICAL ERROR: Missing Google Cloud Storage environment variables for API Route! Please check .env.local file.');
  // throw new Error('Missing Google Cloud Storage environment variables.');
}

const bucket = storage.bucket(GCS_BUCKET_NAME_MAKE as string); 


export async function POST(request: Request) {
  console.log("[API Route DEBUG] POST request received for file upload.");
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error("[API Route ERROR] No file uploaded in the request.");
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    const originalFileName = file.name;
    const fileExtension = originalFileName.split('.').pop() || ''; 
    const taskId = uuidv4(); 
    
    const folderPath = 'uploads'; 
    const fileName = fileExtension ? `${taskId}.${fileExtension}` : taskId; 
    const finalGcsPath = `${folderPath}/${fileName}`; 

    console.log(`[API Route DEBUG] Original File Name: "${originalFileName}"`);
    console.log(`[API Route DEBUG] Extracted File Extension: "${fileExtension}"`);
    console.log(`[API Route DEBUG] Generated Task ID: "${taskId}"`);
    console.log(`[API Route DEBUG] Final GCS Path to upload: "${finalGcsPath}"`); 
    console.log(`[API Route DEBUG] File MIME Type from browser: ${file.type}`);
    console.log(`[API Route DEBUG] Target GCS Bucket (runtime check): "${GCS_BUCKET_NAME_MAKE}"`);

    const arrayBuffer = await file.arrayBuffer(); 
    const buffer = Buffer.from(arrayBuffer); 

    const gcsFile = bucket.file(finalGcsPath); 
    const fileStream = gcsFile.createWriteStream({
      // ★★★ ここを修正 ★★★
      resumable: true, // true に変更して、中断可能アップロードを試す
      metadata: {
        contentType: file.type, 
        metadata: { 
          originalFileName: originalFileName,
          fileExtension: fileExtension,
          taskId: taskId
        }
      },
    });

    await new Promise<void>((resolve, reject) => {
      fileStream.on('error', (err) => {
        console.error('GCS Upload Stream Error (API Route):', err);
        // ストリームが破壊された場合に明示的にreject
        reject(new Error(`GCS Upload Stream Error: ${err.message}`));
      });
      fileStream.on('finish', () => {
        console.log(`[API Route DEBUG] Upload Stream Finished for: gs://${GCS_BUCKET_NAME_MAKE}/${finalGcsPath}`);
        resolve();
      });
      fileStream.end(buffer); 
    });

    return NextResponse.json({ task_id: taskId, file_extension: fileExtension }, { status: 200 });

  } catch (error: unknown) { 
    console.error("ファイルアップロード処理中にエラーが発生しました (API Route):", error);
    let errorMessage = "不明なエラーが発生しました。";
    if (error instanceof Error) { 
      errorMessage = error.message;
    } else if (typeof error === 'string') { 
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) { 
      errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json(
      { message: 'Internal Server Error (API Route)', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function OPTIONS() { 
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type', 
      'Access-Control-Max-Age': '86400', 
    },
  });
}