interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl sm:text-7xl",
  xl: "text-5xl sm:text-7xl md:text-8xl lg:text-9xl",
};

export default function Wordmark({ size = "lg", className = "" }: Props) {
  return (
    <span className={`display-tight inline-flex items-baseline gap-1 ${SIZES[size]} ${className}`}>
      <span className="text-ink">Lawrence</span>
      <span className="text-crimson">/</span>
      <span className="text-jayhawk-deep">Geo</span>
    </span>
  );
}
