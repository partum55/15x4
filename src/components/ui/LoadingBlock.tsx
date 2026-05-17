type LoadingBlockProps = {
  className?: string
  as?: 'div' | 'span'
}

export default function LoadingBlock({ className = '', as = 'div' }: LoadingBlockProps) {
  const Tag = as
  const baseClass = as === 'span' ? 'block animate-pulse bg-black/10' : 'animate-pulse bg-black/10'
  return <Tag className={`${baseClass} ${className}`} />
}
