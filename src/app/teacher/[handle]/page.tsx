import { createClient } from '@/lib/supabase/server'


export default async function PublicTeacherPage({ params }: { params: { handle: string } }) {
  const supabase = await createClient()
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id,handle,subjects,grades,public_profile')
    .eq('handle', params.handle)
    .maybeSingle()

  if (!teacher) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">講師が見つかりません</h1>
      </div>
    )
  }

  const { data: avail } = await supabase
    .from('availability')
    .select('id,slot_start,slot_end')
    .eq('teacher_id', teacher.id)
    .eq('is_bookable', true)
    .order('slot_start', { ascending: true })
    .limit(10)

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id,name,minutes,bundle_qty,price_cents')
    .eq('teacher_id', teacher.id)
    .eq('is_active', true)
    .order('price_cents', { ascending: true })
    .limit(10)

  const formatYen = (cents: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format((cents || 0) / 100)

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">{teacher.handle}</h1>
      <p className="text-gray-600 mb-6">科目: {(teacher.subjects || []).join(' / ')} ・ 学年: {(teacher.grades || []).join(' / ')}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">予約可能な枠（例）</h2>
          {!avail || avail.length === 0 ? (
            <div className="text-gray-500">公開されている空き枠はありません。</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1">
              {avail.map(a => (
                <li key={a.id} className="border rounded p-2">
                  {new Date(a.slot_start).toLocaleString('ja-JP')} - {new Date(a.slot_end).toLocaleTimeString('ja-JP')}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">公開中のチケット</h2>
          {!tickets || tickets.length === 0 ? (
            <div className="text-gray-500">公開されているチケットはありません。</div>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1">
              {tickets.map(t => (
                <li key={t.id} className="border rounded p-2">
                  {t.name}（{t.minutes}分 × {t.bundle_qty}回） — {formatYen(t.price_cents)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

