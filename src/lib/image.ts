"use client";

/**
 * 업로드한 사진을 줄이고 JPEG로 압축한다.
 * DB가 없어 localStorage(약 5MB)에 넣어야 하므로 원본을 그대로 저장하지 않는다.
 * 비율을 함께 돌려주는 이유는, 사진이 잘리거나 늘어나지 않게
 * 표시 영역을 원본 비율에 맞춰야 하기 때문이다.
 */
export interface Photo {
  dataUrl: string;
  /** 가로 / 세로 */
  aspect: number;
}

async function shrink(
  file: File,
  maxW: number,
  maxH: number,
  quality: number,
): Promise<Photo> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 올릴 수 있어요.");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("이미지를 읽지 못했어요. 다른 파일로 시도해주세요.");
  });

  const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리하지 못했어요.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return { dataUrl: canvas.toDataURL("image/jpeg", quality), aspect: w / h };
}

/** 책등 — 세로로 아주 길어서(1:10 내외) 폭은 좁아도 된다 */
export function fileToSpinePhoto(file: File): Promise<Photo> {
  return shrink(file, 240, 1200, 0.72);
}

/**
 * 앞표지 — 상세 페이지에서 크게 보여주므로 책등보다 넉넉하게 잡는다.
 * 한 장에 40~70KB 정도라 localStorage에 수십 권은 들어간다.
 */
export function fileToCoverPhoto(file: File): Promise<Photo> {
  return shrink(file, 520, 780, 0.75);
}
