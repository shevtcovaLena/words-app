'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'

type VirtualListProps<T> = {
  items: T[]
  height?: number
  estimateSize?: number
  overscan?: number
  className?: string
  itemClassName?: string
  getItemKey?: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => React.ReactNode
}

export function VirtualList<T>({
  items,
  height = 500,
  estimateSize = 64,
  overscan = 5,
  className,
  itemClassName,
  getItemKey,
  renderItem,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const getItemKeyMemo = useMemo(() => {
    if (!getItemKey) return undefined
    return (index: number) => getItemKey(items[index]!, index)
  }, [getItemKey, items])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKeyMemo,
  })

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]!
          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
