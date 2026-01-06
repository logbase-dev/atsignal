import { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";

// 👇 키 없이 초기화 (ADC 자동 사용)
// 프로덕션(Firebase Functions)에서는 자동으로 서비스 계정 credential 사용
// 로컬 에뮬레이터에서는 gcloud auth application-default login으로 설정된 credential 사용
const storage = new Storage();

type SignedUrlRequest = {
  fileName: string;
  contentType: string;
  target: "editor" | "authorImage" | "thumbnail" | "featuredImage";
};

export async function handle(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const { fileName, contentType, target }: SignedUrlRequest = request.body;

    if (!fileName || !contentType || !target) {
      response.status(400).json({ error: "fileName, contentType, target are required" });
      return;
    }

    if (!contentType.startsWith("image/")) {
      response.status(400).json({ error: "이미지 파일만 업로드할 수 있습니다." });
      return;
    }

    // Storage bucket 가져오기 (환경 변수 또는 기본값)
    const bucketName = process.env.STORAGE_BUCKET || "atsignal.firebasestorage.app";
    const bucket = storage.bucket(bucketName);
    
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const baseName = `${timestamp}-${safeName}`;

    // 경로 결정
    let storagePath: string;
    if (target === "editor") {
      storagePath = `images/editor/${baseName}`;
    } else {
      storagePath = `images/original/${baseName}`;
    }

    const file = bucket.file(storagePath);

    // Signed URL 생성 (v4, write 액션)
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 15, // 15분
      contentType: contentType,
    });

    // 업로드 후 접근할 공개 URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;

    response.json({
      uploadUrl,
      publicUrl,
      path: storagePath,
      fileName: baseName,
    });
  } catch (error: any) {
    console.error("[Signed URL] 에러:", error);
    
    // client_email 에러인 경우 명확한 안내
    if (error.message?.includes("client_email")) {
      const isEmulator = !!process.env.FUNCTIONS_EMULATOR;
      if (isEmulator) {
        response.status(500).json({ 
          error: "로컬 에뮬레이터에서는 Signed URL 생성에 서비스 계정 키가 필요합니다. 프로덕션 배포 후에는 자동으로 작동합니다.",
          details: "로컬 테스트를 위해서는 서비스 계정 키 파일이 필요하거나, 프로덕션 환경에서 테스트하세요."
        });
      } else {
        response.status(500).json({ 
          error: "Signed URL 생성에 실패했습니다. Functions 서비스 계정에 Storage 권한이 있는지 확인하세요."
        });
      }
      return;
    }
    
    response.status(500).json({ error: error.message || "Signed URL 생성에 실패했습니다." });
  }
}

