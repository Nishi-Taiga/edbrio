import { Link } from '@/i18n/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { EdBrioLogo } from '@/components/ui/edbrio-logo'
import { FileText, Shield, Store } from 'lucide-react'

type Tab = 'terms' | 'privacy' | 'sctl'

const TAB_KEYS: Tab[] = ['terms', 'privacy', 'sctl']

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  terms: <FileText className="w-4 h-4" />,
  privacy: <Shield className="w-4 h-4" />,
  sctl: <Store className="w-4 h-4" />,
}

export async function generateMetadata() {
  const t = await getTranslations('legal')
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const t = await getTranslations('legal')
  const tLanding = await getTranslations('landing')
  const locale = await getLocale()
  const activeTab = (TAB_KEYS.find(k => k === params.tab) ?? 'terms') as Tab

  const tabLabels: Record<Tab, string> = {
    terms: t('tabTerms'),
    privacy: t('tabPrivacy'),
    sctl: t('tabSctl'),
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-950 text-foreground">
      {/* Navigation — same style as LP */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-brand-950/80 backdrop-blur-md border-b border-brand-100/50 dark:border-brand-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <EdBrioLogo size={32} className="shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-300">EdBrio</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition whitespace-nowrap">{tLanding('nav.login')}</Link>
            <Link href="/login" className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg shadow-brand-600/20 whitespace-nowrap">
              {tLanding('nav.getStartedFree')}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-28 sm:pt-32 pb-16">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('pageTitle')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('lastUpdated')}</p>
        </div>

        {/* Non-Japanese locale notice */}
        {locale !== 'ja' && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm text-amber-800 dark:text-amber-200">
            {t('japaneseOnlyNotice')}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 bg-white dark:bg-brand-900/40 p-1 rounded-xl border border-slate-200 dark:border-brand-800/30">
          {TAB_KEYS.map(key => (
            <Link
              key={key}
              href={`/legal?tab=${key}`}
              className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2.5 rounded-lg text-sm font-bold transition ${
                activeTab === key
                  ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-brand-800/30'
              }`}
            >
              {TAB_ICONS[key]}
              <span className="hidden sm:inline">{tabLabels[key]}</span>
            </Link>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-brand-900/30 rounded-2xl border border-slate-200 dark:border-brand-800/30 shadow-sm">
          <div className="p-6 sm:p-10 prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-brand-800/30 prose-h2:pb-3 prose-h2:mb-6 prose-h3:text-base prose-h3:mt-8 prose-table:text-sm">
            {activeTab === 'terms' && <TermsContent />}
            {activeTab === 'privacy' && <PrivacyContent />}
            {activeTab === 'sctl' && <SctlContent />}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 dark:text-slate-500">
          <Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition font-medium">
            {t('contactLink')}
          </Link>
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            &larr; {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function TermsContent() {
  return (
    <>
      <h2>利用規約</h2>
      <p>この利用規約（以下「本規約」）は、EdBrio（以下「当社」）が提供するウェブサービス「EdBrio」（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意いただいた上で本サービスをご利用いただきます。</p>

      <h3>第1条（適用）</h3>
      <ol>
        <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
        <li>当社が本サービス上で掲載する個別規定は、本規約の一部を構成するものとします。</li>
      </ol>

      <h3>第2条（定義）</h3>
      <p>本規約において使用する用語の定義は以下のとおりです。</p>
      <ul>
        <li><strong>「ユーザー」</strong>: 本サービスに登録し利用する個人または法人</li>
        <li><strong>「講師」</strong>: 本サービスを通じて指導サービスを提供する登録ユーザー</li>
        <li><strong>「保護者」</strong>: 本サービスを通じて生徒の学習管理を行う登録ユーザー</li>
        <li><strong>「生徒」</strong>: 講師から指導を受ける対象者</li>
        <li><strong>「コンテンツ」</strong>: ユーザーが本サービスに投稿・登録するテキスト、データ等の情報</li>
      </ul>

      <h3>第3条（アカウント登録）</h3>
      <ol>
        <li>本サービスの利用を希望する方は、当社の定める方法によりアカウント登録を申請するものとします。</li>
        <li>ユーザーは、登録情報に変更が生じた場合、速やかに変更手続きを行うものとします。</li>
        <li>ユーザーは、自己のアカウント情報を適切に管理するものとし、第三者に利用させてはなりません。</li>
        <li>アカウント情報の管理不十分、第三者の使用等による損害の責任はユーザーが負うものとします。</li>
      </ol>

      <h3>第4条（料金・決済）</h3>
      <ol>
        <li>本サービスの一部機能は有料プラン（Standard: 月額¥1,480）にてご利用いただけます。</li>
        <li>決済はStripe株式会社の決済システムを利用して処理されます。</li>
        <li>講師への授業料の支払いにあたり、当社は所定のプラットフォーム手数料（Free: 7%、Standard: 1.4%）を差し引いた金額を講師に振り込みます。なお、別途Stripeの決済手数料（3.6%）が発生します。</li>
        <li>支払い済みの料金は、当社が別途定める場合を除き、返金いたしません。</li>
      </ol>

      <h3>第5条（禁止事項）</h3>
      <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
      <ol>
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>当社のサービスの運営を妨害する行為</li>
        <li>他のユーザーの個人情報を不正に収集する行為</li>
        <li>不正アクセスまたはこれを試みる行為</li>
        <li>他のユーザーに成りすます行為</li>
        <li>本サービスを通じた営業、宣伝、広告、勧誘その他営利を目的とする行為（当社が別途認めたものを除く）</li>
        <li>反社会的勢力等への利益供与</li>
        <li>その他、当社が不適切と判断する行為</li>
      </ol>

      <h3>第6条（サービスの変更・中断・終了）</h3>
      <ol>
        <li>当社は、ユーザーへの事前通知なく、本サービスの内容を変更、追加、削除することができるものとします。</li>
        <li>当社は、以下の事由がある場合、ユーザーへの事前通知なく本サービスの全部または一部の提供を中断することができるものとします。
          <ul>
            <li>システムの保守・点検を行う場合</li>
            <li>地震、落雷、火災等の不可抗力により本サービスの提供が困難な場合</li>
            <li>その他、当社が中断を必要と判断した場合</li>
          </ul>
        </li>
      </ol>

      <h3>第7条（知的財産権）</h3>
      <ol>
        <li>本サービスに関する知的財産権は当社または正当な権利を有する第三者に帰属します。</li>
        <li>ユーザーが本サービスに投稿したコンテンツの著作権はユーザーに帰属しますが、当社はサービスの提供・改善に必要な範囲でこれを利用できるものとします。</li>
        <li>AI機能により生成されたレポートの著作権は、利用規約上、当該レポートを作成した講師に帰属するものとします。</li>
      </ol>

      <h3>第8条（免責事項）</h3>
      <ol>
        <li>当社は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。</li>
        <li>当社は、本サービスに起因してユーザーに生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。</li>
        <li>AI機能により生成されたコンテンツの正確性、完全性については保証いたしません。ユーザーの責任においてご確認の上ご利用ください。</li>
      </ol>

      <h3>第9条（個人情報の取り扱い）</h3>
      <p>ユーザーの個人情報の取り扱いについては、別途定める「プライバシーポリシー」に従うものとします。</p>

      <h3>第10条（準拠法・裁判管轄）</h3>
      <ol>
        <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
        <li>本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
      </ol>
    </>
  )
}

function PrivacyContent() {
  return (
    <>
      <h2>プライバシーポリシー</h2>
      <p>EdBrio（以下「当社」）は、ユーザーの個人情報の保護を重要視しています。本プライバシーポリシーは、本サービスにおける個人情報の収集、利用、管理に関する方針を定めるものです。</p>

      <h3>1. 収集する情報</h3>
      <p>当社は、以下の情報を収集します。</p>
      <ul>
        <li><strong>アカウント情報</strong>: メールアドレス、氏名、役割（講師/保護者）</li>
        <li><strong>プロフィール情報</strong>: 担当教科、生徒情報（氏名、学年等）</li>
        <li><strong>利用データ</strong>: 授業メモ、レポート内容、予約履歴、学習目標</li>
        <li><strong>決済情報</strong>: Stripe経由での決済に必要な情報（カード情報は当社サーバーには保存されません）</li>
        <li><strong>技術情報</strong>: IPアドレス、ブラウザ情報、アクセスログ</li>
      </ul>

      <h3>2. 利用目的</h3>
      <p>収集した情報は以下の目的で利用します。</p>
      <ul>
        <li>本サービスの提供、運営、改善</li>
        <li>ユーザーサポートの提供</li>
        <li>AI報告書生成機能の提供</li>
        <li>決済処理およびチケット管理</li>
        <li>サービスに関するお知らせ・通知の送信</li>
        <li>利用状況の分析およびサービス品質向上</li>
        <li>不正利用の検知・防止</li>
      </ul>

      <h3>3. 第三者提供</h3>
      <p>当社は、以下のサービスプロバイダーと必要な範囲で個人情報を共有します。</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>サービス</th>
              <th>提供者</th>
              <th>目的</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Supabase</td><td>Supabase, Inc.</td><td>認証・データベース管理</td></tr>
            <tr><td>Stripe</td><td>Stripe, Inc.</td><td>決済処理</td></tr>
            <tr><td>Anthropic Claude</td><td>Anthropic, PBC</td><td>AI報告書生成</td></tr>
            <tr><td>Resend</td><td>Resend, Inc.</td><td>メール送信</td></tr>
          </tbody>
        </table>
      </div>
      <p>上記以外に、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。</p>

      <h3>4. セキュリティ</h3>
      <ul>
        <li>すべての通信はHTTPS（SSL/TLS）により暗号化されています。</li>
        <li>データベースアクセスはRow Level Security（RLS）により保護されています。</li>
        <li>決済情報はPCI DSS準拠のStripe社にて管理され、当社サーバーには保存されません。</li>
        <li>パスワードはハッシュ化して保存されます。</li>
      </ul>

      <h3>5. ユーザーの権利</h3>
      <p>ユーザーは、以下の権利を有します。</p>
      <ul>
        <li><strong>アクセス権</strong>: 当社が保有するご自身の個人情報へのアクセス</li>
        <li><strong>訂正権</strong>: 不正確な個人情報の訂正</li>
        <li><strong>削除権</strong>: アカウント削除による個人情報の消去</li>
        <li><strong>データポータビリティ</strong>: ご自身のデータのエクスポート</li>
      </ul>
      <p>上記の権利の行使をご希望の場合は、お問い合わせ先までご連絡ください。</p>

      <h3>6. Cookie について</h3>
      <p>本サービスでは、認証セッションの維持のためにCookieを使用します。本サービスを利用することで、Cookieの使用に同意したものとみなします。</p>

      <h3>7. プライバシーポリシーの変更</h3>
      <p>当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上でお知らせします。</p>
    </>
  )
}

function SctlContent() {
  return (
    <>
      <h2>特定商取引法に基づく表記</h2>
      <div className="overflow-x-auto">
        <table>
          <tbody>
            <tr><td className="font-bold whitespace-nowrap">事業者名</td><td>WINS</td></tr>
            <tr><td className="font-bold whitespace-nowrap">メールアドレス</td><td>info@edbrio.com</td></tr>
            <tr><td className="font-bold whitespace-nowrap">サービス名</td><td>EdBrio</td></tr>
            <tr><td className="font-bold whitespace-nowrap">サービスURL</td><td>https://edbrio.com</td></tr>
            <tr>
              <td className="font-bold whitespace-nowrap">販売価格</td>
              <td>
                <ul className="list-none p-0 m-0 space-y-1">
                  <li>Freeプラン: 無料</li>
                  <li>Standardプラン: 月額 ¥1,480（税込）</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="font-bold whitespace-nowrap">追加手数料</td>
              <td>
                <ul className="list-none p-0 m-0 space-y-1">
                  <li>Freeプラン: 決済額の7%</li>
                  <li>Standardプラン: 決済額の1.4%</li>
                  <li>※上記に加え、Stripe決済手数料（3.6%）が別途発生します</li>
                </ul>
              </td>
            </tr>
            <tr><td className="font-bold whitespace-nowrap">支払方法</td><td>クレジットカード（Stripe経由）</td></tr>
            <tr><td className="font-bold whitespace-nowrap">支払時期</td><td>サブスクリプション登録時およびその後毎月自動課金</td></tr>
            <tr><td className="font-bold whitespace-nowrap">サービス提供時期</td><td>アカウント登録完了後、直ちにご利用いただけます</td></tr>
            <tr>
              <td className="font-bold whitespace-nowrap">返品・キャンセル</td>
              <td>
                <ul className="list-none p-0 m-0 space-y-1">
                  <li>無料トライアル期間中は無料でキャンセル可能</li>
                  <li>有料プランは翌月分からのキャンセルが可能</li>
                  <li>既にお支払い済みの料金の返金は原則いたしません</li>
                </ul>
              </td>
            </tr>
            <tr><td className="font-bold whitespace-nowrap">動作環境</td><td>最新版のChrome、Safari、Firefox、Edge（インターネット接続が必要）</td></tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
