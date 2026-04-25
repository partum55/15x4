type ChevronIconProps = {
  direction?: 'down' | 'up'
}

export default function ChevronIcon({ direction = 'down' }: ChevronIconProps) {
  return (
    <svg
      width="21"
      height="18"
      viewBox="0 0 21 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
      aria-hidden="true"
    >
      <g transform="translate(0, -3)">
        <path
          d="M18.9545 8.6974L20.0151 7.63674L17.8938 5.51542L16.8331 6.57608L17.8938 7.63674L18.9545 8.6974ZM17.8938 7.63674L16.8331 6.57608L8.34786 15.0614L9.40852 16.122L10.4692 17.1827L18.9545 8.6974L17.8938 7.63674Z"
          fill="currentColor"
        />
        <path
          d="M3.18062 7.07397L2.11858 6.01469L1.94609e-05 8.13877L1.06206 9.19805L2.12134 8.13601L3.18062 7.07397ZM2.12134 8.13601L1.06206 9.19805L9.55109 17.665L10.6104 16.603L11.6696 15.5409L3.18062 7.07397L2.12134 8.13601Z"
          fill="currentColor"
        />
      </g>
    </svg>

  )
}
