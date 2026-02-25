'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { HandoverNote } from '@/lib/types/database'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface HandoverNoteListProps {
  notes: HandoverNote[]
  onAdd: () => void
  onDelete: (id: string) => void
}

export function HandoverNoteList({ notes, onAdd, onDelete }: HandoverNoteListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">引継ぎメモ</h3>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" />メモ追加
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">引継ぎメモはまだありません。</p>
          <Button variant="outline" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />最初のメモを追加
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {note.content}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {format(new Date(note.created_at), 'PPP', { locale: ja })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 shrink-0"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
