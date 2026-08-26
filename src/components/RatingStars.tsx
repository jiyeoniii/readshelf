"use client";

export default function RatingStars({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "text-sm" : "text-2xl";

  return (
    <div className={`flex items-center gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <span className={filled ? "text-accent" : "text-line"}>★</span>
        );
        if (!onChange) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n}점`}
            onClick={() => onChange(value === n ? 0 : n)}
            className="leading-none transition hover:scale-110"
          >
            {star}
          </button>
        );
      })}
      {onChange && value > 0 && (
        <span className="ml-2.5 font-[family-name:var(--font-serif)] text-base text-muted">
          {value}.0
        </span>
      )}
    </div>
  );
}
