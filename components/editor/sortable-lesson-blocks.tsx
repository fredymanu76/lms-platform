'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { GripVertical, Trash2 } from 'lucide-react'

interface LessonBlock {
  id?: string
  lesson_id?: string
  block_type: 'heading' | 'text' | 'callout' | 'list' | 'video' | 'file'
  content: any
  sort_order: number
}

interface SortableBlockProps {
  block: LessonBlock
  blockIndex: number
  onUpdate: (content: any) => void
  onDelete: () => void
}

function SortableBlock({ block, blockIndex, onUpdate, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `block-${blockIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-3 bg-background"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <Badge variant="outline">{block.block_type}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>

      {block.block_type === 'heading' && (
        <Input
          value={block.content?.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Heading text"
        />
      )}

      {block.block_type === 'text' && (
        <RichTextEditor
          content={block.content?.html || ''}
          onChange={(html) => onUpdate({ html })}
          placeholder="Enter your content here..."
        />
      )}

      {block.block_type === 'callout' && (
        <div className="space-y-2">
          <Select
            value={block.content?.type || 'info'}
            onValueChange={(value) => onUpdate({ ...block.content, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={block.content?.text || ''}
            onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
            placeholder="Callout text"
            rows={2}
          />
        </div>
      )}

      {block.block_type === 'list' && (
        <Textarea
          value={(block.content?.items || []).join('\n')}
          onChange={(e) => onUpdate({ items: e.target.value.split('\n').filter(Boolean) })}
          placeholder="Enter list items (one per line)"
          rows={4}
        />
      )}

      {block.block_type === 'video' && (
        <div className="space-y-3">
          <Input
            value={block.content?.title || ''}
            onChange={(e) => onUpdate({ ...block.content, title: e.target.value })}
            placeholder="Video title (optional)"
          />
          <div className="space-y-1">
            <Input
              value={block.content?.url || ''}
              onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
              placeholder="YouTube or Vimeo URL"
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube or Vimeo URL. The video will be embedded automatically.
            </p>
          </div>
        </div>
      )}

      {block.block_type === 'file' && (
        <div className="space-y-2">
          <Input
            value={block.content?.fileName || ''}
            onChange={(e) => onUpdate({ ...block.content, fileName: e.target.value })}
            placeholder="File name"
          />
          <Input
            value={block.content?.url || ''}
            onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
            placeholder="File URL"
          />
        </div>
      )}
    </div>
  )
}

interface SortableLessonBlocksProps {
  blocks: LessonBlock[]
  onReorder: (blocks: LessonBlock[]) => void
  onUpdateBlock: (blockIndex: number, content: any) => void
  onDeleteBlock: (blockIndex: number) => void
}

export function SortableLessonBlocks({
  blocks,
  onReorder,
  onUpdateBlock,
  onDeleteBlock,
}: SortableLessonBlocksProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('block-', ''))
      const newIndex = parseInt(String(over.id).replace('block-', ''))

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        sort_order: index,
      }))

      onReorder(reorderedBlocks)
    }
  }

  if (blocks.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((_, index) => `block-${index}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {blocks.map((block, blockIndex) => (
            <SortableBlock
              key={blockIndex}
              block={block}
              blockIndex={blockIndex}
              onUpdate={(content) => onUpdateBlock(blockIndex, content)}
              onDelete={() => onDeleteBlock(blockIndex)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
