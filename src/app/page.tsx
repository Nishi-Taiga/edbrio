'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { GraduationCap, Sparkles, BookOpen, Calendar, CreditCard, ArrowRight, ChevronDown, Check } from 'lucide-react'

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
    description: '家庭教師のためのAI報告書生成・生徒管理システム',
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
            <a href="#use-cases" className="hover:text-primary-600 transition">活用シーン</a>
            <a href="#pricing" className="hover:text-primary-600 transition">料金</a>
            <a href="#faq" className="hover:text-primary-600 transition">よくある質問</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-primary-600">ログイン</Link>
            <Link href="/login" className="bg-primary-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 bg-[radial-gradient(#e2e8f0_0.5px,transparent_0.5px)] [background-size:24px_24px]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 text-xs font-bold text-primary-600 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI報告書生成で業務時間を1/3に
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-8">
            授業メモを入力するだけ。<br />
            <span className="text-primary-600">報告書はAIにおまかせ。</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            EdBrioは、家庭教師・個別指導講師のための管理システム。<br className="hidden md:block" />
            授業後のメモから保護者向け報告書をAIが自動生成します。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/login" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-3xl font-bold text-lg transition shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2">
              無料で始める <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-10 py-5 rounded-3xl font-bold text-lg transition">
              機能を詳しく見る
            </a>
          </div>

          {/* AI Report Flow Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-100 to-blue-50 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>
            <div className="bg-white rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100">
              <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                {/* Step 1: Memo Input */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">STEP 1 — 授業メモ入力</div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="bg-white rounded-lg p-3 border border-slate-100">教科: 数学</div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">理解度: ★★★★☆</div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">二次方程式の基本は理解。応用問題でつまずきあり。</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-primary-600">AI生成</span>
                </div>

                {/* Step 2: Report Output */}
                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 text-left">
                  <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">STEP 2 — 報告書完成</div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p className="font-bold">本日の数学の授業報告</p>
                    <p className="text-slate-600 leading-relaxed">二次方程式の解の公式について学習しました。基本的な計算は正確に行えています。応用問題では...</p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-bold">保護者共有OK</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">宿題付き</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">指導に必要なすべてが、<span className="text-primary-600">ここに。</span></h2>
            <p className="text-slate-500 text-lg">LINE、Excel、銀行アプリ、手帳。バラバラだったツールをEdBrioがスマートに統合します。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Reports */}
            <div className="p-10 rounded-3xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-8">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI報告書生成</h3>
              <p className="text-slate-500 leading-relaxed">
                授業後のメモを入力するだけで、AIが保護者向けの丁寧な報告書を自動生成。理解度・宿題・次回予定まで含めたプロ仕様のレポートを数秒で作成します。
              </p>
            </div>
            {/* Student Karte */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-8">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">生徒カルテ</h3>
              <p className="text-slate-500 leading-relaxed">
                学習目標・つまずきポイント・得意分野を一元管理。生徒ごとの指導方針を可視化し、講師間の引継ぎもスムーズに行えます。
              </p>
            </div>
            {/* Scheduling */}
            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:translate-y-[-8px] transition duration-300">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-8">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">予定管理</h3>
              <p className="text-slate-500 leading-relaxed">
                カレンダーに予定を入れるだけで、月末の請求金額を自動計算。振替授業の管理もミスなく完結します。
              </p>
            </div>
            {/* Payments */}
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

      {/* Use Cases */}
      <section id="use-cases" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">こんな方に<span className="text-primary-600">選ばれています</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              <div className="text-4xl mb-6">🏠</div>
              <h3 className="text-xl font-bold mb-3">家庭教師</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                毎回の報告書作成に30分→AI生成で5分に短縮。保護者との信頼関係構築に集中できます。
              </p>
            </div>
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              <div className="text-4xl mb-6">🏫</div>
              <h3 className="text-xl font-bold mb-3">個別指導塾</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                複数講師間の情報共有を生徒カルテで一元化。引継ぎメモで代講時もスムーズに対応。
              </p>
            </div>
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              <div className="text-4xl mb-6">💻</div>
              <h3 className="text-xl font-bold mb-3">オンライン講師</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                予約管理から報告書共有、決済まで完全オンラインで完結。場所を選ばず指導に集中。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
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
              <Link href="/login" className="w-full py-5 rounded-2xl bg-slate-100 text-slate-900 font-bold text-center hover:bg-slate-200 transition block">
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
                    <Check className="w-5 h-5 text-primary-600" /> AI報告書 無制限生成
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> Stripe決済連携（月謝請求）
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 font-bold">
                    <Check className="w-5 h-5 text-primary-600" /> 優先カスタマーサポート
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-5 rounded-2xl bg-primary-600 text-white font-bold text-center hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 block">
                無料で1ヶ月試してみる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16 tracking-tight">よくある質問</h2>
          <div className="space-y-4">
            <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm">
              <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-lg list-none">
                AI報告書の精度はどの程度ですか？
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-slate-500 leading-relaxed">
                Claude AIを活用し、授業メモの内容に基づいて自然な日本語の報告書を生成します。生成後に編集も可能なため、先生のスタイルに合わせて調整できます。
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm">
              <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-lg list-none">
                親御さんはアプリをインストールする必要がありますか？
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-slate-500 leading-relaxed">
                いいえ、不要です。保護者はブラウザからログインするだけで、報告書の閲覧や学習進捗の確認ができます。
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm">
              <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-lg list-none">
                無料トライアル期間が終わるとどうなりますか？
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-slate-500 leading-relaxed">
                自動的にStandardプランへ移行されます。期間内にダッシュボードから解約すれば、一切費用はかかりません。
              </div>
            </details>
            <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm">
              <summary className="p-6 cursor-pointer flex items-center justify-between font-bold text-lg list-none">
                データのセキュリティは大丈夫ですか？
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-slate-500 leading-relaxed">
                Supabase（PostgreSQL）のRow Level Securityにより、各ユーザーは自分のデータのみアクセス可能です。通信はすべてHTTPS暗号化されています。
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            報告書作成の時間を、<br /><span className="text-primary-600">指導の質向上に。</span>
          </h2>
          <p className="text-slate-500 text-lg mb-10">
            無料で始められます。クレジットカード不要。
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-10 py-5 rounded-3xl font-bold text-lg transition shadow-xl shadow-primary-600/30">
            今すぐ無料で始める <ArrowRight className="w-5 h-5" />
          </Link>
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
              家庭教師・個別指導講師のための、AI報告書生成＆生徒管理システム。
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
          <span>&copy; 2025 EDBRIO ALL RIGHTS RESERVED</span>
        </div>
      </footer>
    </div>
  )
}
