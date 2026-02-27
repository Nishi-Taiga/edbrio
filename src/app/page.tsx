'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, BookOpen, Calendar, CreditCard, ArrowRight, ChevronDown, Check, Menu, X } from 'lucide-react'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="light bg-white text-foreground font-sans antialiased" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', colorScheme: 'light' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-b border-brand-100/50 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EdBrioLogo size={32} className="shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-300">EdBrio</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">機能</a>
            <a href="#use-cases" className="hover:text-brand-600 dark:hover:text-brand-400 transition">活用シーン</a>
            <a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">料金</a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition">よくある質問</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition">ログイン</Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-brand-600/20">
              無料で始める
            </Link>
            <button
              type="button"
              className="md:hidden p-2 text-slate-500 hover:text-brand-600 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="メニュー"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-brand-950/95 backdrop-blur-md border-t border-brand-100/50 dark:border-brand-800/30 px-4 pb-4">
            <div className="flex flex-col gap-1 pt-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <a href="#features" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>機能</a>
              <a href="#use-cases" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>活用シーン</a>
              <a href="#pricing" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>料金</a>
              <a href="#faq" className="py-2.5 hover:text-brand-600 transition" onClick={() => setMobileMenuOpen(false)}>よくある質問</a>
              <Link href="/login" className="py-2.5 text-brand-600 font-bold sm:hidden" onClick={() => setMobileMenuOpen(false)}>ログイン</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950 dark:via-background dark:to-background">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-brand-400/20 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-accent-400/15 dark:bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-40 bg-brand-300/10 dark:bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/50 border border-brand-100 dark:border-brand-700/50 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-brand-600 dark:text-brand-300 mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            AI報告書生成で業務時間を1/3に
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] mb-6 sm:mb-8">
            <span className="text-slate-900 dark:text-white">授業メモを入力するだけ。</span><br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">報告書はAIにおまかせ。</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
            EdBrioは、家庭教師・個別指導講師のための管理システム。<br className="hidden md:block" />
            授業後のメモから保護者向け報告書をAIが自動生成します。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-20">
            <Link href="/login" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-3xl font-bold text-base sm:text-lg transition shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2">
              無料で始める <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white dark:bg-brand-900/50 border border-slate-200 dark:border-brand-700/50 hover:bg-slate-50 dark:hover:bg-brand-800/50 text-slate-700 dark:text-slate-200 px-8 sm:px-10 py-4 sm:py-5 rounded-3xl font-bold text-base sm:text-lg transition text-center">
              機能を詳しく見る
            </a>
          </div>

          {/* AI Report Flow Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-400/30 to-accent-400/20 dark:from-brand-600/20 dark:to-accent-600/10 rounded-[2rem] sm:rounded-[2.5rem] blur-2xl -z-10" />
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-[0_32px_64px_-16px_rgba(124,58,237,0.15)] dark:shadow-[0_32px_64px_-16px_rgba(124,58,237,0.3)] border border-brand-100/50 dark:border-brand-700/30">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
                {/* Step 1 */}
                <div className="bg-slate-50 dark:bg-brand-950/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-brand-800/50 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 sm:mb-3">STEP 1 — 授業メモ入力</div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">教科: 数学</div>
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">理解度: ★★★★☆</div>
                    <div className="bg-white dark:bg-brand-900/30 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-brand-800/30">二次方程式の基本は理解。応用問題でつまずきあり。</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex md:flex-col items-center gap-2 py-1 md:py-0">
                  <div className="hidden md:block w-0 h-0" />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-600 to-accent-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400">AI生成</span>
                </div>

                {/* Step 2 */}
                <div className="bg-brand-50 dark:bg-brand-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-brand-100 dark:border-brand-700/30 text-left">
                  <div className="text-[10px] sm:text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2 sm:mb-3">STEP 2 — 報告書完成</div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">本日の数学の授業報告</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">二次方程式の解の公式について学習しました。基本的な計算は正確に行えています。応用問題では...</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-brand-100 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">保護者共有OK</span>
                      <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">宿題付き</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-32 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-24">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">
              指導に必要なすべてが、<span className="text-brand-600 dark:text-brand-400">ここに。</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">LINE、Excel、銀行アプリ、手帳。バラバラだったツールをEdBrioがスマートに統合します。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* AI Reports — featured */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-900/30 dark:to-brand-950/50 border border-brand-100 dark:border-brand-700/30 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(124,58,237,0.2)] hover:translate-y-[-8px] hover:shadow-[0_20px_40px_-10px_rgba(124,58,237,0.2)] transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-100 dark:bg-brand-800/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5 sm:mb-8">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">AI報告書生成</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                授業後のメモを入力するだけで、AIが保護者向けの丁寧な報告書を自動生成。理解度・宿題・次回予定まで含めたプロ仕様のレポートを数秒で作成します。
              </p>
            </div>
            {/* Student Karte */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 sm:mb-8">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">生徒カルテ</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                学習目標・つまずきポイント・得意分野を一元管理。生徒ごとの指導方針を可視化し、講師間の引継ぎもスムーズに行えます。
              </p>
            </div>
            {/* Scheduling */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-50 dark:bg-purple-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 sm:mb-8">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">予定管理</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                カレンダーに予定を入れるだけで、月末の請求金額を自動計算。振替授業の管理もミスなく完結します。
              </p>
            </div>
            {/* Payments */}
            <div className="group p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-surface-raised border border-slate-100 dark:border-brand-800/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:translate-y-[-8px] hover:border-brand-200 dark:hover:border-brand-700/50 transition duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 sm:mb-8">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">シームレス決済</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                Stripe連携により、請求書の自動送付から入金確認まで自動化。現金や振込確認の手間から解放されます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-16 sm:py-32 px-4 sm:px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">
              こんな方に<span className="text-brand-600 dark:text-brand-400">選ばれています</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">🏠</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">家庭教師</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                毎回の報告書作成に30分→AI生成で5分に短縮。保護者との信頼関係構築に集中できます。
              </p>
            </div>
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">🏫</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">個別指導塾</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                複数講師間の情報共有を生徒カルテで一元化。引継ぎメモで代講時もスムーズに対応。
              </p>
            </div>
            <div className="bg-white dark:bg-surface-raised rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">💻</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">オンライン講師</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                予約管理から報告書共有、決済まで完全オンラインで完結。場所を選ばず指導に集中。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 sm:py-32 px-4 sm:px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 dark:text-white">シンプルで明快な料金</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg">先生の規模に合わせて。まずはお試しから。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white dark:bg-surface-raised rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-brand-800/30 flex flex-col">
              <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-2">Free</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6">¥0</div>
              <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 text-sm">まずは無料で使い始める</p>
              <div className="flex-1">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> 生徒数 2名まで
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> AI報告書 月5件まで
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> 予定・カレンダー管理
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">
                    <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> 生徒カルテ
                  </li>
                  <li className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium text-sm sm:text-base">
                    <span className="w-5 h-5 shrink-0 text-center text-xs leading-5">—</span> 決済手数料 7%
                  </li>
                  <li className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-medium text-sm sm:text-base">
                    <span className="w-5 h-5 shrink-0 text-center text-xs leading-5">—</span> Stripe決済連携なし
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 sm:py-5 rounded-2xl bg-slate-100 dark:bg-brand-900/50 text-slate-900 dark:text-slate-200 font-bold text-center hover:bg-slate-200 dark:hover:bg-brand-800/50 transition block text-sm sm:text-base">
                無料で始める
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="bg-white dark:bg-surface-raised rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border-2 border-brand-600 dark:border-brand-500 shadow-2xl shadow-brand-600/10 dark:shadow-brand-600/20 flex flex-col relative">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-brand-600 dark:bg-brand-500 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold">
                1ヶ月無料お試し
              </div>
              <h3 className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-2">Standard</h3>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6">¥1,480<span className="text-base sm:text-lg font-medium text-slate-400 dark:text-slate-500">/月</span></div>
              <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-10 text-xs sm:text-sm">※30日間無料トライアル。期間中の解約なら¥0。</p>
              <div className="flex-1">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> 生徒数 無制限
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> AI報告書 無制限生成
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> 予定・カレンダー管理
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> 生徒カルテ
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> Stripe決済連携（手数料 2%）
                  </li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base">
                    <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" /> 優先カスタマーサポート
                  </li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-4 sm:py-5 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white font-bold text-center transition shadow-lg shadow-brand-600/20 block text-sm sm:text-base">
                無料で1ヶ月試してみる
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-32 px-4 sm:px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-center mb-10 sm:mb-16 tracking-tight text-slate-900 dark:text-white">よくある質問</h2>
          <div className="space-y-3 sm:space-y-4">
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>AI報告書の精度はどの程度ですか？</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                Claude AIを活用し、授業メモの内容に基づいて自然な日本語の報告書を生成します。生成後に編集も可能なため、先生のスタイルに合わせて調整できます。
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>親御さんはアプリをインストールする必要がありますか？</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                いいえ、不要です。保護者はブラウザからログインするだけで、報告書の閲覧や学習進捗の確認ができます。
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>無料トライアル期間が終わるとどうなりますか？</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                自動的にStandardプランへ移行されます。期間内にダッシュボードから解約すれば、一切費用はかかりません。
              </div>
            </details>
            <details className="group bg-white dark:bg-surface-raised rounded-xl sm:rounded-2xl border border-slate-100 dark:border-brand-800/20 shadow-sm dark:shadow-md dark:shadow-black/20">
              <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between font-bold text-base sm:text-lg list-none text-slate-900 dark:text-white gap-2">
                <span>データのセキュリティは大丈夫ですか？</span>
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                Supabase（PostgreSQL）のRow Level Securityにより、各ユーザーは自分のデータのみアクセス可能です。通信はすべてHTTPS暗号化されています。
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-16 sm:py-32 px-4 sm:px-6 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-50/50 to-transparent dark:from-transparent dark:via-brand-900/20 dark:to-transparent -z-10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6">
            <span className="text-slate-900 dark:text-white">報告書作成の時間を、</span><br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">指導の質向上に。</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg mb-8 sm:mb-10">
            無料で始められます。クレジットカード不要。
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-3xl font-bold text-base sm:text-lg transition shadow-xl shadow-brand-600/30">
            今すぐ無料で始める <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-surface pt-12 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 border-t border-slate-200 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 mb-12 sm:mb-20">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
              <EdBrioLogo size={32} className="shrink-0" />
              <span className="text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-400">EdBrio</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
              家庭教師・個別指導講師のための、AI報告書生成＆生徒管理システム。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 sm:gap-16 w-full md:w-auto">
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">プロダクト</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">機能</a></li>
                <li><a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">料金</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">規約</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><Link href="/legal?tab=sctl" className="hover:text-brand-600 dark:hover:text-brand-400 transition">特定商取引法</Link></li>
                <li><Link href="/legal?tab=privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">プライバシー</Link></li>
                <li><Link href="/legal?tab=contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition">お問い合わせ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 sm:mb-6">SNS</h4>
              <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest">
          <span>&copy; 2025 EDBRIO ALL RIGHTS RESERVED</span>
        </div>
      </footer>
    </div>
  )
}
