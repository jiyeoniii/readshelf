import {
  BottomCrest,
  CornerFlourish,
  TopCrest,
} from "@/components/ShelfDecor";

/**
 * 책장을 감싸는 장식 액자.
 *
 * 직선 테두리는 CSS로, 곡선 장식은 SVG로 나눠 그린다.
 * 한 장짜리 SVG를 늘이면 소용돌이가 찌그러지기 때문이다.
 */
export default function ShelfFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* 액자 본체 — 겹선 */}
      <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-accent/25" />
      <div className="pointer-events-none absolute inset-[7px] rounded-[26px] border border-accent/15" />

      {/* 모서리 소용돌이 */}
      <span className="pointer-events-none absolute -left-1 -top-1 text-accent/35">
        <CornerFlourish />
      </span>
      <span className="pointer-events-none absolute -right-1 -top-1 -scale-x-100 text-accent/35">
        <CornerFlourish />
      </span>
      <span className="pointer-events-none absolute -bottom-1 -left-1 -scale-y-100 text-accent/35">
        <CornerFlourish />
      </span>
      <span className="pointer-events-none absolute -bottom-1 -right-1 -scale-100 text-accent/35">
        <CornerFlourish />
      </span>

      {/* 위아래 가운데 장식 — 배경색으로 테두리를 끊어 얹는다 */}
      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 bg-bg px-3 text-accent/40">
        <TopCrest />
      </span>
      <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 bg-bg px-3 text-accent/40">
        <BottomCrest />
      </span>

      <div className="relative px-6 pb-14 pt-12 sm:px-12">{children}</div>
    </div>
  );
}
