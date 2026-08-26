/**
 * 책장 장식 — 분홍 선화로 그린 액자와 소품들.
 *
 * 늘어나면 곡선이 찌그러지므로 테두리 직선은 CSS로 긋고,
 * 장식은 각자 비율을 지키는 SVG로 모서리·가운데에 얹는다.
 * 전부 stroke="currentColor"라 부모의 text 색을 따라간다.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 네 모서리에 놓는 소용돌이 장식 */
export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 92"
      className={className}
      width="92"
      height="92"
      aria-hidden
    >
      <g {...stroke}>
        {/* 바깥·안쪽 겹선 */}
        <path d="M0 34C0 15 15 0 34 0" />
        <path d="M7 36C7 20 20 7 36 7" />
        {/* 위로 뻗는 덩굴 */}
        <path d="M36 7c12 0 19 5 19 12 0 6-5 10-10 10s-8-4-7-8" />
        <path d="M55 19c6-3 12-2 16 2" />
        {/* 옆으로 뻗는 덩굴 */}
        <path d="M7 36c0 12 5 19 12 19 6 0 10-5 10-10s-4-8-8-7" />
        <path d="M19 55c-3 6-2 12 2 16" />
        {/* 잎과 알맹이 */}
        <path d="M42 22c3-4 8-5 11-2-3 4-8 5-11 2z" />
        <path d="M22 42c-4 3-5 8-2 11 4-3 5-8 2-11z" />
        <circle cx="46" cy="19" r="1.5" />
        <circle cx="19" cy="46" r="1.5" />
        <circle cx="70" cy="23" r="1.2" />
        <circle cx="23" cy="70" r="1.2" />
      </g>
    </svg>
  );
}

/** 위 가운데 얹는 아치 장식 — 하트와 리본 */
export function TopCrest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 54"
      className={className}
      width="220"
      height="54"
      aria-hidden
    >
      <g {...stroke}>
        {/* 이중 아치 */}
        <path d="M2 46C40 46 62 40 78 26 92 14 100 10 110 10s18 4 32 16c16 14 38 20 76 20" />
        <path d="M14 52C48 52 68 46 82 33 95 22 102 18 110 18s15 4 28 15c14 13 34 19 68 19" />
        {/* 하트 */}
        <path d="M110 30c-4-6-13-4-13 3 0 6 8 10 13 14 5-4 13-8 13-14 0-7-9-9-13-3z" />
        {/* 양옆 리본 자락 */}
        <path d="M84 26c-7-6-15-7-19-2-3 4 0 9 6 9 4 0 8-3 13-7z" />
        <path d="M136 26c7-6 15-7 19-2 3 4 0 9-6 9-4 0-8-3-13-7z" />
        {/* 반짝임 */}
        <path d="M62 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
        <path d="M158 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
      </g>
    </svg>
  );
}

/** 아래 가운데 장식 — 위 아치를 뒤집은 모양에 작은 하트 */
export function BottomCrest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 40"
      className={className}
      width="180"
      height="40"
      aria-hidden
    >
      <g {...stroke}>
        <path d="M2 4C36 4 56 10 70 22 82 32 86 36 90 36s8-4 20-14c14-12 34-18 68-18" />
        <path d="M90 12c-3-5-10-3-10 2 0 5 6 8 10 11 4-3 10-6 10-11 0-5-7-7-10-2z" />
        <circle cx="52" cy="14" r="1.3" />
        <circle cx="128" cy="14" r="1.3" />
      </g>
    </svg>
  );
}

/** 선반 위에 앉은 토끼 두 마리 */
export function Rabbits({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 76"
      className={className}
      width="158"
      height="91"
      aria-hidden
    >
      <g {...stroke}>
        {/* 왼쪽 토끼 */}
        <g transform="translate(6 4)">
          <ellipse cx="26" cy="52" rx="15" ry="14" />
          <circle cx="26" cy="27" r="10" />
          <ellipse cx="21" cy="11" rx="4" ry="11" transform="rotate(-12 21 11)" />
          <ellipse cx="32" cy="11" rx="4" ry="11" transform="rotate(12 32 11)" />
          <circle cx="22" cy="27" r="1.2" />
          <circle cx="30" cy="27" r="1.2" />
          <path d="M25 31c.7.8 1.3.8 2 0" />
          <circle cx="43" cy="55" r="4.5" />
          <ellipse cx="19" cy="65" rx="6" ry="3" />
          <ellipse cx="33" cy="65" rx="6" ry="3" />
        </g>
        {/* 오른쪽 토끼 — 조금 작게 */}
        <g transform="translate(64 14) scale(0.86)">
          <ellipse cx="26" cy="52" rx="15" ry="14" />
          <circle cx="26" cy="27" r="10" />
          <ellipse cx="20" cy="12" rx="4" ry="11" transform="rotate(-20 20 12)" />
          <ellipse cx="33" cy="11" rx="4" ry="11" transform="rotate(8 33 11)" />
          <circle cx="22" cy="27" r="1.2" />
          <circle cx="30" cy="27" r="1.2" />
          <path d="M25 31c.7.8 1.3.8 2 0" />
          <circle cx="9" cy="55" r="4.5" />
          <ellipse cx="19" cy="65" rx="6" ry="3" />
          <ellipse cx="33" cy="65" rx="6" ry="3" />
        </g>
      </g>
    </svg>
  );
}

/** 선반 오른쪽에 둘 꽃병 */
export function FlowerVase({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 132"
      className={className}
      width="104"
      height="143"
      aria-hidden
    >
      <g {...stroke}>
        {/* 줄기 */}
        <path d="M48 78C48 60 44 46 36 34" />
        <path d="M48 78C50 62 56 50 66 40" />
        <path d="M48 80C46 68 42 60 34 54" />
        {/* 잎 */}
        <path d="M44 60c-6-2-11 0-13 5 6 2 11 0 13-5z" />
        <path d="M53 58c6-3 11-2 14 3-6 3-11 2-14-3z" />
        {/* 꽃 세 송이 */}
        <Flower cx={34} cy={28} r={7} />
        <Flower cx={68} cy={35} r={6} />
        <Flower cx={31} cy={50} r={5} />
        {/* 병 */}
        <path d="M36 80h24c9 0 15 8 15 20s-8 24-27 24-27-12-27-24 6-20 15-20z" />
        <path d="M36 80c-1-6-1-10 0-14h24c1 4 1 8 0 14" />
        <path d="M34 66h28" />
        <path d="M27 104c8 4 34 4 42 0" />
      </g>
    </svg>
  );
}

/** 꽃 한 송이 — 다섯 장 꽃잎 */
function Flower({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = [0, 1, 2, 3, 4].map((i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return (
      <ellipse
        key={i}
        cx={cx + Math.cos(a) * r * 0.72}
        cy={cy + Math.sin(a) * r * 0.72}
        rx={r * 0.5}
        ry={r * 0.42}
        transform={`rotate(${(a * 180) / Math.PI} ${
          cx + Math.cos(a) * r * 0.72
        } ${cy + Math.sin(a) * r * 0.72})`}
      />
    );
  });
  return (
    <>
      {petals}
      <circle cx={cx} cy={cy} r={r * 0.28} />
    </>
  );
}

/** 선반 위에 눕혀 쌓아둔 책 세 권 */
export function BookStack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 46"
      className={className}
      width="92"
      height="46"
      aria-hidden
    >
      <g {...stroke}>
        <rect x="6" y="30" width="80" height="12" rx="2" />
        <path d="M12 30v12" />
        <rect x="12" y="18" width="68" height="12" rx="2" />
        <path d="M18 18v12" />
        <rect x="20" y="6" width="54" height="12" rx="2" />
        <path d="M26 6v12" />
      </g>
    </svg>
  );
}
