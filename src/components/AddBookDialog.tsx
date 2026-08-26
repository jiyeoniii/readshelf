"use client";

import { useRef, useState } from "react";
import type { BookSearchResult } from "@/app/api/books/search/route";
import BookSearch from "@/components/BookSearch";
import { SpineFace, spineSize } from "@/components/BookSpine";
import { fileToCoverPhoto, fileToSpinePhoto, type Photo } from "@/lib/image";
import { addBook, newId } from "@/lib/storage";
import { GENRES, SPINE_COLORS, type Genre } from "@/lib/types";

/** 다이얼로그가 길어지지 않게 미리보기는 줄여서 보여준다 */
const PREVIEW_SCALE = 0.62;

export default function AddBookDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [genre, setGenre] = useState<Genre>("에세이");
  const [totalPages, setTotalPages] = useState("");
  const [spineColor, setSpineColor] = useState<string>(SPINE_COLORS[0]);

  // 책등 사진은 선택 사항 — 없으면 색상 템플릿으로 그린다
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // 앞표지는 검색으로 받은 URL이거나, 직접 올린 사진이다
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<Photo | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0;

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 이벤트가 오게 한다
    if (!file) return;

    setPhotoBusy(true);
    setError(null);
    try {
      setPhoto(await fileToSpinePhoto(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진을 읽지 못했어요.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setCoverBusy(true);
    setError(null);
    try {
      setCoverPhoto(await fileToCoverPhoto(file));
      setCoverUrl(null); // 직접 올린 사진이 검색 표지보다 우선한다
    } catch (err) {
      setError(err instanceof Error ? err.message : "표지를 읽지 못했어요.");
    } finally {
      setCoverBusy(false);
    }
  }

  /** 검색 결과를 고르면 빈 칸만 채우고, 이미 쓴 값은 건드리지 않는다 */
  function applySearchResult(r: BookSearchResult, pages: number | null) {
    setTitle(r.title);
    if (r.author) setAuthor(r.author);
    if (r.publisher) setPublisher(r.publisher);
    if (pages) setTotalPages(String(pages));
    if (r.coverUrl) {
      setCoverUrl(r.coverUrl);
      setCoverPhoto(null);
    }
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      addBook({
        id: newId(),
        title: title.trim(),
        author: author.trim() || "저자 미상",
        publisher: publisher.trim(),
        genre,
        spineColor,
        spineImage: photo?.dataUrl ?? null,
        spineAspect: photo?.aspect ?? null,
        coverImage: coverPhoto?.dataUrl ?? coverUrl,
        coverAspect: coverPhoto?.aspect ?? null,
        totalPages: Number(totalPages) || 0,
        rating: 0,
        review: "",
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      // 저장 공간이 가득 찬 경우 — 다이얼로그를 닫지 않고 알린다
      setError(
        err instanceof Error ? err.message : "책을 저장하지 못했어요.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-t-2xl border border-line bg-surface p-6 shadow-2xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold">책 추가</h2>
        <p className="mt-1 text-sm text-muted">
          한 권을 추가할 때마다 나의 책장이 채워집니다.
        </p>

        <div className="mt-5 space-y-4">
          <BookSearch
            query={title}
            onQueryChange={setTitle}
            onPick={applySearchResult}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="저자">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예) 김호연"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>

            <Field label="출판사">
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="예) 문학동네"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="장르">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="총 페이지">
              <input
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="예) 320"
                className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          </div>

          <div className="flex gap-5">
            <div className="min-w-0 flex-1 space-y-4">
              {/* 사진을 올리면 색상은 쓰이지 않으므로 흐리게 둔다 */}
              <div className={photo ? "opacity-40 transition" : "transition"}>
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  책등 색상
                </span>
                <div className="flex flex-wrap gap-2">
                  {SPINE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSpineColor(c)}
                      style={{ backgroundColor: c }}
                      aria-label={`색상 ${c}`}
                      className={`h-8 w-8 rounded-md ring-offset-2 ring-offset-surface transition ${
                        spineColor === c ? "ring-2 ring-ink" : "ring-1 ring-black/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  책등 사진{" "}
                  <span className="font-normal text-muted/70">(선택)</span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={photoBusy}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink disabled:opacity-50"
                  >
                    {photoBusy
                      ? "처리 중…"
                      : photo
                        ? "사진 바꾸기"
                        : "사진 올리기"}
                  </button>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="text-xs text-muted underline hover:text-red-500"
                    >
                      지우기
                    </button>
                  )}
                </div>

                <p className="mt-1.5 text-[11px] leading-relaxed text-muted/80">
                  {photo
                    ? "사진이 색상 템플릿 대신 쓰입니다."
                    : "실제 책 옆면을 찍어 올리면 그대로 보입니다."}
                </p>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={onPickPhoto}
                  className="hidden"
                />
              </div>
            </div>

            {/* 책등 미리보기 — 입력하는 대로 바뀐다 */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-muted">책등</span>
              <SpinePreview
                title={title || "제목"}
                author={author}
                publisher={publisher}
                spineColor={spineColor}
                totalPages={Number(totalPages) || 0}
                photo={photo}
              />
            </div>
          </div>

          {/* 앞표지 — 검색으로 자동으로 채워지고, 없으면 직접 올린다 */}
          <div className="flex items-start gap-4 rounded-xl border border-line bg-bg p-3">
            <CoverThumb
              src={coverPhoto?.dataUrl ?? coverUrl}
              alt={title || "표지"}
            />

            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-muted">
                앞표지{" "}
                {coverUrl && (
                  <span className="font-normal text-accent">검색으로 자동 입력됨</span>
                )}
              </span>

              <p className="mt-1 text-[11px] leading-relaxed text-muted/80">
                {coverPhoto
                  ? "직접 올린 표지를 씁니다."
                  : coverUrl
                    ? "알라딘에서 가져온 표지입니다."
                    : "위에서 표지를 검색하거나, 직접 찍어 올릴 수 있어요."}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  disabled={coverBusy}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink disabled:opacity-50"
                >
                  {coverBusy
                    ? "처리 중…"
                    : coverPhoto || coverUrl
                      ? "직접 올리기"
                      : "표지 사진 올리기"}
                </button>

                {(coverPhoto || coverUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPhoto(null);
                      setCoverUrl(null);
                    }}
                    className="text-xs text-muted underline hover:text-red-500"
                  >
                    지우기
                  </button>
                )}
              </div>

              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                onChange={onPickCover}
                className="hidden"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            책장에 꽂기
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/** 표지 미리보기 — 없으면 자리만 잡아둔다 */
function CoverThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <span className="flex h-[84px] w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-line text-[10px] text-muted">
        표지
      </span>
    );
  }
  return (
    // 알라딘 CDN URL 또는 사용자가 올린 data URL이라 next/image 대상은 아니다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-[84px] w-14 shrink-0 rounded-md object-cover shadow-sm"
    />
  );
}

/** 다이얼로그 안에서 책등이 어떻게 보일지 미리 보여준다 */
function SpinePreview({
  title,
  author,
  publisher,
  spineColor,
  totalPages,
  photo,
}: {
  title: string;
  author: string;
  publisher: string;
  spineColor: string;
  totalPages: number;
  photo: Photo | null;
}) {
  const base = spineSize(totalPages, photo?.aspect ?? null);
  const width = Math.round(base.width * PREVIEW_SCALE);
  const height = Math.round(base.height * PREVIEW_SCALE);

  const book = {
    id: "preview",
    title,
    author: author || "저자",
    publisher,
    spineColor,
    spineImage: photo?.dataUrl ?? null,
    spineAspect: photo?.aspect ?? null,
    coverImage: null,
    coverAspect: null,
    genre: "에세이" as const,
    totalPages,
    rating: 0,
    review: "",
    createdAt: "",
  };

  return (
    <div
      style={{ width, height }}
      className="relative overflow-hidden rounded-[2px] shadow-[3px_2px_8px_rgba(0,0,0,0.3)]"
    >
      <SpineFace book={book} width={width} height={height} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.10) 6%, rgba(255,255,255,.16) 22%, rgba(255,255,255,.03) 44%, rgba(0,0,0,.08) 72%, rgba(0,0,0,.34) 100%)",
          opacity: photo ? 0.4 : 1,
        }}
      />
    </div>
  );
}
