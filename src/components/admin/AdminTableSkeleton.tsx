'use client'

interface AdminTableSkeletonProps {
  rows?: number
  cols?: number
}

export default function AdminTableSkeleton({ rows = 6, cols = 5 }: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full border-collapse">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-black/20">
              {Array.from({ length: cols }).map((__, columnIndex) => (
                <td key={columnIndex} className="p-3">
                  <span
                    className={`block h-5 animate-pulse bg-black/10 ${
                      columnIndex === 0 ? 'w-full max-w-[200px]' : 
                      columnIndex === cols - 1 ? 'ml-auto w-full max-w-[150px]' : 
                      'w-24'
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
