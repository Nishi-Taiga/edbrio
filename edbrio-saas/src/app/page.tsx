'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import './landing.css'

// SEO metadata is handled in layout.tsx for client components
// This page includes proper h1 tag and semantic structure for SEO

export default function HomePage() {
  const { user, dbUser, loading } = useAuth()

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!loading && user && dbUser) {
      if (dbUser.role === 'teacher') {
        window.location.href = '/teacher/dashboard'
      } else if (dbUser.role === 'guardian') {
        window.location.href = '/guardian/dashboard'
      }
    }
  }, [loading, user, dbUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EdBrio',
    applicationCategory: 'EducationalApplication',
    description: '家庭教師のための予約・決済・レポート管理',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      description: '無料でアカウント作成可能'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    },
    featureList: [
      'スケジュール管理',
      '授業記録共有',
      'チケット決済'
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header>
        <div className="container nav" aria-label="グローバルナビゲーション">
          <Link href="/" className="brand" aria-label="EdBrio ホームへ">
            <EdBrioLogo size={32} className="brand-logo" />
            <span>EdBrio</span>
          </Link>
          <nav className="row nav-links" aria-label="主要ナビゲーション">
            <a href="#values" className="nav-link">機能</a>
            <a href="#flow" className="nav-link">使い方</a>
            <a href="#faq" className="nav-link">FAQ</a>
            <Link className="ghost" href="/login">ログイン</Link>
            <Link className="primary" href="/teacher/signup" data-analytics="cta-header-signup">無料登録</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero container" id="hero">
          <div className="hero-grid">
            <div>
              <h1>家庭教師のための、予約・決済・レポート管理。</h1>
              <p className="lead">シフトを公開すれば、保護者が予約。前払いチケットで支払いを先に。授業後はテンプレートでレポートを送信。同じ画面で完結します。</p>
              <div className="spacer"></div>
              <Link className="primary" href="/teacher/signup" data-analytics="cta-hero-signup" aria-label="無料登録へ">無料登録</Link>
            </div>
            <aside className="mock" aria-label="製品UIプレビュー">
              <div className="mock-head"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
              <div className="mock-body grid">
                <div className="cal" aria-label="予約カレンダーモック">
                  <strong>カレンダー</strong>
                  <div className="chips" style={{ marginTop: '8px' }}>
                    <span className="chip">空き枠：水 17:00</span>
                    <span className="chip chip-booked">予約済：木 19:00</span>
                    <span className="chip">空き枠：金 20:00</span>
                  </div>
                </div>
                <div className="row">
                  <span className="chip" aria-label="チケット情報">🎫 チケット：残り3</span>
                  <span className="chip" aria-label="チャット未読">💬 未読1</span>
                  <span className="chip" aria-label="レポート送信状況">📝 レポート送信済</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Values: 3機能 */}
        <section className="section section-alt" id="values" aria-labelledby="values-title">
          <div className="container">
            <h2 className="section-title" id="values-title">EdBrioでできること</h2>
            <div className="cards">
              <article className="card" aria-label="スケジュール管理">
                <div className="muted">📅 スケジュール管理</div>
                <h3>カレンダー上で、授業を整理。</h3>
                <p className="muted">シフトの登録、予約の確認、変更やキャンセル。すべて同じ画面で行えます。</p>
              </article>
              <article className="card" aria-label="授業記録共有">
                <div className="muted">🧾 授業記録共有</div>
                <h3>授業の内容を、記録して共有。</h3>
                <p className="muted">レポートを作成して送信。保護者は履歴から内容を確認できます。</p>
              </article>
              <article className="card" aria-label="チケット決済">
                <div className="muted">🎫 チケット決済</div>
                <h3>チケットで、授業を管理。</h3>
                <p className="muted">授業チケットを作成・販売し、残数や有効期限を反映します。</p>
              </article>
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="section container" id="flow" aria-labelledby="flow-title">
          <h2 className="section-title" id="flow-title">導入から授業まで、3ステップ。</h2>
          <div className="flow" role="list">
            <div className="flow-step" role="listitem">
              <div className="badge" aria-hidden="true">1</div>
              <div>
                <strong>登録・設定</strong>
                <p className="muted">無料登録後、プロフィールと保護者情報、チケットを設定。短時間で準備が整います。</p>
              </div>
            </div>
            <div className="flow-step" role="listitem">
              <div className="badge" aria-hidden="true">2</div>
              <div>
                <strong>シフト公開</strong>
                <p className="muted">カレンダーに空き時間を登録すれば、保護者がその枠を予約できます。変更やキャンセルも同じ画面で。</p>
              </div>
            </div>
            <div className="flow-step" role="listitem">
              <div className="badge" aria-hidden="true">3</div>
              <div>
                <strong>授業とレポート</strong>
                <p className="muted">授業後はテンプレート入力で送信。保護者に共有され、次回につながります。</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="section container" id="ui" aria-labelledby="ui-title">
          <h2 className="section-title" id="ui-title">画面イメージ</h2>
          <div className="gallery">
            <figure className="ui">
              <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='760'%3E%3Crect width='100%25' height='100%25' fill='%23f2f3f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='%23999'%3EカレンダーUI（ダミー）%3C/text%3E%3C/svg%3E" alt="カレンダーでシフトを公開する様子（イメージ）"/>
              <figcaption className="cap">📅 スケジュール管理 — 空き時間を登録して、予約を受け付けます。</figcaption>
            </figure>
            <figure className="ui">
              <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='760'%3E%3Crect width='100%25' height='100%25' fill='%23f2f3f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='%23999'%3Eチャットui（ダミー）%3C/text%3E%3C/svg%3E" alt="保護者とのチャット画面（イメージ）"/>
              <figcaption className="cap">💬 メッセージ — 予約にひもづいて整理されます。</figcaption>
            </figure>
            <figure className="ui">
              <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='760'%3E%3Crect width='100%25' height='100%25' fill='%23f2f3f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='%23999'%3EレポートUI（ダミー）%3C/text%3E%3C/svg%3E" alt="レポート入力フォーム（イメージ）"/>
              <figcaption className="cap">🧾 授業記録共有 — テンプレに沿って記録し、共有します。</figcaption>
            </figure>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section-alt" id="faq" aria-labelledby="faq-title">
          <div className="container faq">
            <h2 className="section-title" id="faq-title">よくある質問</h2>
            <details>
              <summary>個人でも使えますか？</summary>
              <p>はい。個人登録からすぐ始められます。副業・フリーランスでも問題ありません。</p>
            </details>
            <details>
              <summary>チケット価格は自由に設定できますか？</summary>
              <p>可能です。1回制・回数制、有効期限も自由に設定できます。</p>
            </details>
            <details>
              <summary>スマホだけで使えますか？</summary>
              <p>はい。スマホブラウザで全機能が利用できます。</p>
            </details>
            <details>
              <summary>キャンセルや返金はどうなりますか？</summary>
              <p>あらかじめ設定したポリシーに沿って処理されます。</p>
            </details>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="cta" aria-label="クロージングCTA">
          <div className="container center">
            <h2 className="section-title" style={{ marginBottom: '18px' }}>EdBrioで、予約・記録・決済をひとつに。</h2>
            <Link className="primary" href="/teacher/signup" data-analytics="cta-bottom-signup">無料登録</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-content">
          <small className="footer-copy">© EdBrio</small>
          <nav className="row" aria-label="フッターナビ">
            <Link className="ghost" href="/legal">利用規約</Link>
            <Link className="ghost" href="/legal">プライバシーポリシー</Link>
            <Link className="ghost" href="/legal">お問い合わせ</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
