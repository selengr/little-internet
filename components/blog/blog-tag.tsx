import { cn } from '@/lib/utils'
import styles from './blog-tag.module.css'

export function BlogTagList({
  tags,
  align = 'center',
  className,
}: {
  tags: string[]
  align?: 'center' | 'start'
  className?: string
}) {
  if (tags.length === 0) return null

  return (
    <div
      className={cn(
        styles['post-blog-property-map-opt'],
        align === 'start' && styles['post-blog-property-map-opt--start'],
        className,
      )}
    >
      {tags.map(tag => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  )
}
