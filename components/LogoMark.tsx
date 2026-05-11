interface Props {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 24, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 2C9.92 2 5 6.92 5 13c0 5.6 5.5 12 9.6 16.4a2 2 0 0 0 2.8 0C21.5 25 27 18.6 27 13c0-6.08-4.92-11-11-11z"
        className="fill-crimson"
      />
      <circle cx="16" cy="13" r="5" className="fill-paper" />
      <path
        d="M12.5 17 19.5 9"
        className="stroke-jayhawk-deep"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
