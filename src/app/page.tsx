'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { GraduationCap, LayoutDashboard, FileText, Calendar, CreditCard, Check } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EdBrio',
    applicationCategory: 'EducationalApplication',
    description: '家庭教師のためのオールインワン管理システム',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      description: '無料でアカウント作成可能'
    }
  }

  return (
    <div className="bg-white text-slate-900 font-sans antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-extrabold tracking-tight text-primary-700 flex items-center gap-2">
            <div className="bg-primary-600 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            EdBrio
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-primary-600 transition">機能</a>
            <a href="#pricing" className="hover:text-primary-600 transition">料金</a>
            <a href="#faq" className="hover:text-primary-600 transition">よくある質問</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-primary-600">ログイン</Link>
            <Link href="#pricing" className="bg-primary-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 bg-[radial-gradient(#e2e8f0_0.5px,transparent_0.5px)] [background-size:24px_24px]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 text-xs font-bold text-primary-600 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
            </span>
            Standardプラン 1ヶ月無料キャンペーン中
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-8">
            指導に、<span className="text-primary-600">もっと情熱を。</span><br />
            事務はこれひとつで。
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            EdBrioは、個人家庭教師のためのオールインワン管理SaaS。<br className="hidden md:block" />
            報告・予定・決済を統合し、プロの仕事をスマートに支えます。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/teacher/signup" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-3xl font-bold text-lg transition shadow-xl shadow-primary-600/30">
              まずは無料で始める
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-10 py-5 rounded-3xl font-bold text-lg transition">
              機能を詳しく見る
            </a>
          </div>

          {/* Dashboard Preview Card */}
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-100 to-blue-50 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>
            <div className="bg-white rounded-3xl p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100">
              <div className="bg-slate-50 rounded-2xl aspect-[16/9] flex items-center justify-center border border-slate-200 overflow-hidden">
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <LayoutDashboard className="w-16 h-16" />
                  <span className="font-bold text-xl uppercase tracking-widest">App Interface Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Logos */}
      <div className="py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">信頼の管理実績</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
            <div className="text-xl font-black">個人指導連合</div>
            <div className="text-xl font-black">Tutor Network</div>
            <div className="text-xl font-black">EduPartner</div>
            <div className="text-xl font-black">PROFESSO</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">教育のすべてを、<span className="text-primary-600">ひとつの場所に。</span></h2>
            <p className="text-slate-500 text-lg">LINE、Excel、銀行アプリ、手帳。バラバラだったツールをEdBrioがスマートに統合します。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary-600 mb-8">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">統合報告書</h3>
              <p className="text-slate-500 leading-relaxed">
                指導記録をスマホで入力するだけ。親御さんへプロ仕様のレポートを自動生成し、専用URLで即座に共有できます。
              </p>
            </div>
            {/* Feature Card */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-8">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">予定管理</h3>
              <p className="text-slate-500 leading-relaxed">
                カレンダーに予定を入れるだけで、月末の請求金額を自動計算。振替授業の管理もミスなく完結します。
              </p>
            </div>
            {/* Feature Card */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">シームレス決済</h3>
              <p className="text-slate-500 leading-relaxed">
                Stripe連携により、請求書の自動送付から入金確認まで自動化。現金や振込確認の手間から解放されます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">シンプルで明快な料金</h2>
            <p className="text-slate-500 text-lg">先生の規模に合わせて。まずはお試しから。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-400 mb-2">Free</h3>
              <div className="text-5xl font-black mb-6">¥0</div>
              <p className="text-slate-500 mb-10">まずは無料で使い始める</p>
              <div className="flex-1">
                <ul className="space-y-4 mb-12">
                  <li className="flex items-center gap-3 text-slate-600 font-medium">
                    <Check className="w-5 h-5 text-emerald-500" /> 生徒数 2名まで
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-medium">
                    <Check className="w-5 h-5 text-emerald-500" /> 基本的な予定・報告機能
                  </li>
                </ul>
              </div>
              <Link href="/teacher/signup" className="w-full py-5 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition">
                無料で始める
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="bg-white rounded-[2.5rem] p-12 border-2 border-primary-600 shadow-2xl shadow-primary-600/10 flex flex-col relative">
              <div className="absolute top-8 right-8 bg-primary-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                1ヶ月無料お試し
              </div>
              <h3 className="text-lg font-bold text-primary-600 mb-2">Standard</h3>
              <div className="text-5xl font-black mb-6">¥1,480<span className="text-lg font-medium text-slate-400">/月</span></div>
              <p className="text-slate-500 mb-10 text-sm">※30日間無料トライアル。期間中の解約なら¥0。</p>
              <div className="flex-1">
                <ul className="space-y-4 mb-12">
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> 生徒数 無制限
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> Stripe決済連携（月謝請求）
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> 指導報告書のPDF出力
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> 優先カスタマーサポート
                  </li>
                </ul>
              </div>
              <Link href="/teacher/signup" className="w-full py-5 rounded-2xl bg-primary-600 text-white font-bold text-center hover:bg-primary-700 transition shadow-lg shadow-primary-600/20">
                無料で1ヶ月試してみる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 italic tracking-tight">FAQ</h2>
          <div className="space-y-6">
            <div className="p-8 rounded-2xl border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
              <h4 className="font-bold text-lg mb-2">無料トライアル期間が終わるとどうなりますか？</h4>
              <p className="text-slate-500 leading-relaxed">自動的にStandardプランへ移行されます。期間内にダッシュボードから解約すれば、一切費用はかかりません。</p>
            </div>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
              <h4 className="font-bold text-lg mb-2">親御さんはアプリをインストールする必要がありますか？</h4>
              <p className="text-slate-500 leading-relaxed">いいえ、不要です。先生が共有する専用のWebページ（URL）をブラウザで開くだけで、報告書を確認できます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          <div className="max-w-xs">
            <div className="text-2xl font-extrabold tracking-tight text-primary-700 flex items-center gap-2 mb-6">
              <div className="bg-primary-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              EdBrio
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              家庭教師のプロフェッショナルな活動を支える、オールインワン・マネジメントシステム。
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">プロダクト</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-600">
                <li><a href="#features" className="hover:text-primary-600 transition">機能</a></li>
                <li><a href="#pricing" className="hover:text-primary-600 transition">料金</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">規約・サポート</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-600">
                <li><Link href="/legal" className="hover:text-primary-600 transition">特定商取引法</Link></li>
                <li><Link href="/legal" className="hover:text-primary-600 transition">プライバシーポリシー</Link></li>
                <li><Link href="/legal" className="hover:text-primary-600 transition">お問い合わせ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">SNS</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-600">
                <li><a href="#" className="hover:text-primary-600 transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-widest">
          <span>&copy; 2024 EDBRIO ALL RIGHTS RESERVED</span>
        </div>
      </footer>
    </div>
  )
}

