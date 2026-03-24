import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const RETENTION_DAYS = 30
const BATCH_SIZE = 100

/**
 * Cron job: 30日以上経過したチャット画像を削除する。
 * 1. messages テーブルから期限切れの image_url を取得
 * 2. Storage から画像ファイルを削除
 * 3. messages.image_url を null に更新
 *
 * 毎日 03:00 UTC に実行（vercel.json で設定）
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // 期限切れの画像付きメッセージを取得
    const { data: messages, error: fetchErr } = await supabase
      .from('messages')
      .select('id, image_url')
      .not('image_url', 'is', null)
      .lt('created_at', cutoff)
      .limit(BATCH_SIZE)

    if (fetchErr) throw fetchErr
    if (!messages || messages.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No expired images' })
    }

    // Storage パスを抽出（URL → バケット内パス）
    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-images/`
    const storagePaths: string[] = []
    const messageIds: string[] = []

    for (const msg of messages) {
      if (!msg.image_url) continue
      const path = msg.image_url.replace(bucketUrl, '')
      if (path && path !== msg.image_url) {
        storagePaths.push(path)
        messageIds.push(msg.id)
      }
    }

    if (storagePaths.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No valid storage paths' })
    }

    // Storage からファイルを削除
    const { error: removeErr } = await supabase.storage
      .from('chat-images')
      .remove(storagePaths)
    if (removeErr) {
      console.error('Storage remove error:', removeErr)
    }

    // messages.image_url を null に更新
    const { error: updateErr } = await supabase
      .from('messages')
      .update({ image_url: null })
      .in('id', messageIds)
    if (updateErr) throw updateErr

    return NextResponse.json({
      deleted: storagePaths.length,
      messageIds,
    })
  } catch (error: unknown) {
    console.error('Cleanup chat images cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
