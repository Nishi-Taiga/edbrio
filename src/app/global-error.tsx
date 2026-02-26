'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#f5f0ff' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
              予期しないエラーが発生しました
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              ご不便をおかけして申し訳ありません。もう一度お試しください。
            </p>
            <button
              onClick={reset}
              style={{
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 32px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              もう一度試す
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
