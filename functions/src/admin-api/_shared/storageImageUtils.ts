import { admin } from "../../firebase";

type StorageDeleteOptions = {
  logPrefix?: string;
};

export async function deleteImagesForFileName(fileName: string, opts: StorageDeleteOptions = {}): Promise<void> {
  const logPrefix = opts.logPrefix || "Storage";
  const bucket = admin.storage().bucket();
  const sizes = ["thumbnail", "medium", "large", "original"];

  await Promise.all(
    sizes.map((size) =>
      bucket
        .file(`images/${size}/${fileName}`)
        .delete({ ignoreNotFound: true })
        .catch((err) => {
          if (err?.code !== 404) {
            console.warn(`[${logPrefix}] 이미지 삭제 실패: images/${size}/${fileName}`, err);
          }
        })
    )
  );
}


