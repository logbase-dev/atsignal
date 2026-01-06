import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sharp from "sharp";

/**
 * Storage 트리거: 이미지 업로드 완료 시 후처리
 * - images/editor/* → thumbnail, medium, large 생성
 * - images/original/* → 필요 시 최적화 (선택)
 */
export const processImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath) {
      console.log("[Image Processor] 파일 경로가 없습니다.");
      return;
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // 이미 처리된 파일은 건너뛰기 (thumbnail, medium, large 등)
    if (
      filePath.includes("/thumbnail/") ||
      filePath.includes("/medium/") ||
      filePath.includes("/large/")
    ) {
      console.log("[Image Processor] 이미 처리된 파일입니다:", filePath);
      return;
    }

    try {
      // 원본 이미지 다운로드
      const [fileBuffer] = await file.download();
      console.log("[Image Processor] 원본 이미지 다운로드 완료:", filePath, "크기:", fileBuffer.length);

      // 이미지 타입 확인
      if (!object.contentType?.startsWith("image/")) {
        console.log("[Image Processor] 이미지 파일이 아닙니다:", object.contentType);
        return;
      }

      // 경로에 따라 처리
      if (filePath.startsWith("images/editor/")) {
        // 에디터 이미지: thumbnail, medium, large 생성
        await processEditorImage(bucket, filePath, fileBuffer);
      } else if (filePath.startsWith("images/original/")) {
        // 원본 이미지: 필요 시 최적화 (현재는 스킵, 나중에 추가 가능)
        console.log("[Image Processor] 원본 이미지는 현재 후처리를 하지 않습니다:", filePath);
        // 필요 시 여기에 최적화 로직 추가
      }
    } catch (error: any) {
      console.error("[Image Processor] 에러:", error);
      // 에러가 발생해도 원본 파일은 유지
    }
  });

/**
 * 에디터 이미지 후처리: 여러 크기 버전 생성
 */
async function processEditorImage(
  bucket: ReturnType<ReturnType<typeof admin.storage>['bucket']>,
  originalPath: string,
  fileBuffer: Buffer
) {
  const sizes = [
    { name: "thumbnail", width: 300 },
    { name: "medium", width: 800 },
    { name: "large", width: 1200 },
  ];

  // 파일명 추출 (images/editor/{filename})
  const fileName = originalPath.replace("images/editor/", "");

  // 병렬 처리로 여러 크기 생성
  const processPromises = sizes.map(async ({ name, width }) => {
    try {
      const optimized = await sharp(fileBuffer)
        .resize(width, null, { withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();

      const optimizedPath = `images/editor/${name}/${fileName}`;
      await bucket.file(optimizedPath).save(optimized, {
        contentType: "image/webp",
        resumable: false,
      });

      console.log(`[Image Processor] ${name} 생성 완료:`, optimizedPath, "크기:", optimized.length);
    } catch (error: any) {
      console.error(`[Image Processor] ${name} 생성 실패:`, error);
    }
  });

  await Promise.all(processPromises);
  console.log("[Image Processor] 에디터 이미지 후처리 완료:", originalPath);
}

