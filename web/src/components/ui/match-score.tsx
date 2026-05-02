export function MatchScoreBadge({
  score,
  size = "md",
}: {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (score === null || score === undefined) return null;

  const rounded = Math.round(score);
  const { label, bg, text } = getScoreStyle(rounded);

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${bg} ${text} ${sizeClasses}`}
      title={`${rounded}% match — ${label}`}
    >
      {rounded}%
    </span>
  );
}

export function MatchScoreRing({
  score,
  size = 48,
}: {
  score: number | null | undefined;
  size?: number;
}) {
  if (score === null || score === undefined) return null;

  const rounded = Math.round(score);
  const { color } = getScoreStyle(rounded);
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rounded / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {rounded}
      </span>
    </div>
  );
}

function getScoreStyle(score: number) {
  if (score >= 85)
    return {
      label: "Excellent Match",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      color: "#059669",
    };
  if (score >= 70)
    return {
      label: "Good Match",
      bg: "bg-primary-light",
      text: "text-primary",
      color: "#14532D",
    };
  if (score >= 50)
    return {
      label: "Fair Match",
      bg: "bg-amber-50",
      text: "text-amber-700",
      color: "#B45309",
    };
  if (score >= 30)
    return {
      label: "Low Match",
      bg: "bg-orange-50",
      text: "text-orange-700",
      color: "#C2410C",
    };
  return {
    label: "Poor Match",
    bg: "bg-red-50",
    text: "text-red-600",
    color: "#DC2626",
  };
}
