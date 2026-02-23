'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import './landing.css'

export default function HomePage() {
  const { user, dbUser, loading } = useAuth()

  useEffect(() => {
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
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header>
        <div className="container nav" aria-label="グローバルナビゲーション">
          <Link href="/" className="brand" aria-label="EdBrio ホームへ">
            <EdBrioLogo size={32} className="brand-logo" />
            <span>EdBrio</span>
          </Link>
          <nav className="row nav-links" aria-label="主要ナビゲーション">
            <Link className="ghost" href="/login">ログイン</Link>
            <Link className="primary" href="/teacher/signup" data-analytics="cta-header-signup">無料登録</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="pdf-embed" aria-label="ランディングページPDFプレビュー">
          <object data="/landing.pdf" type="application/pdf" className="pdf-object" aria-label="ランディングPDF">
            <iframe src="/landing.pdf" className="pdf-object" title="ランディングPDF"></iframe>
          </object>
          <div className="pdf-fallback">
            <p>
              PDFを表示できない場合は
              <a href="/landing.pdf" className="primary" target="_blank" rel="noopener noreferrer">こちら</a>
              からダウンロードしてご覧ください。
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-content">
          <small className="footer-copy">© EdBrio</small>
          <nav className="row" aria-label="フッターナビ">
            <Link className="ghost" href="/legal">利用規約</Link>
            <Link className="ghost" href="/legal">プライバシーポリシー</Link>
            <Link className="ghost" href="/legal">お問合わせ</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}

