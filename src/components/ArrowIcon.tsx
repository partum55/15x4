export default function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Diagonal top line of arrowhead */}
      <line
        x1="0"
        y1="17"
        x2="10"
        y2="7"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Horizontal arrow shaft */}
      <line
        x1="7"
        y1="1"
        x2="17"
        y2="1"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Vertical right side of arrowhead */}
      <line
        x1="16"
        y1="0"
        x2="16"
        y2="10"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}
