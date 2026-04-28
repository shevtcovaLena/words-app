import { memo } from 'react'
import type { Database } from '@/types/supabase'
import { Badge } from '@/components/ui/badge'

type Word = Database['public']['Tables']['words']['Row']

const WordRow = memo(function WordRow({
  word,
  isSelected,
  onToggle,
  badgeCount,
  variant,
}: {
  word: Word
  isSelected: boolean
  onToggle: (id: string) => void
  badgeCount: number
  variant: 'available' | 'group'
}) {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors ${
        isSelected
          ? variant === 'available'
            ? 'bg-primary/10 border-primary'
            : 'bg-destructive/10 border-destructive'
          : 'hover:bg-muted border-transparent'
      }`}
      onClick={() => onToggle(word.id)}
    >
      <div className="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          onClick={(e) => {
            e.stopPropagation()
          }}
          checked={isSelected}
          onChange={() => onToggle(word.id)}
          className="min-h-[20px] min-w-[20px]"
        />
        <div className="flex-1">
          <span className="font-medium">{word.full_word}</span>
          <span className="text-muted-foreground ml-2 font-mono text-sm">
            {word.mask}
          </span>
        </div>
        {badgeCount > 0 && (
          <Badge
            variant="secondary"
            className="h-3 w-3 rounded-full border-yellow-500 bg-yellow-400 p-0"
          />
        )}
      </div>
    </div>
  )
})

export default WordRow
