import { EdBrioFinalLogo } from "./components/EdBrioFinalLogo";

export default function App() {
  return (
    <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-white overflow-auto">
      <div className="min-h-full flex flex-col items-center justify-center p-8 gap-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            EdBrio 最終ロゴデザイン
          </h1>
          <p className="text-purple-600/70">家庭教師予約サービス</p>
        </div>

        {/* Main Icon Display */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-purple-200/50 p-12 border border-purple-100">
          <EdBrioFinalLogo size={240} />
        </div>

        {/* Size Variations */}
        <div className="w-full max-w-4xl">
          <h2 className="text-purple-900 mb-6 text-center">サイズバリエーション</h2>
          <div className="bg-white rounded-xl shadow-lg shadow-purple-100/50 p-8 border border-purple-100">
            <div className="flex items-end justify-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-3">
                <EdBrioFinalLogo size={160} />
                <span className="text-purple-600/60 text-sm">Large (160px)</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <EdBrioFinalLogo size={120} />
                <span className="text-purple-600/60 text-sm">Medium (120px)</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <EdBrioFinalLogo size={80} />
                <span className="text-purple-600/60 text-sm">Small (80px)</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <EdBrioFinalLogo size={48} />
                <span className="text-purple-600/60 text-sm">Mini (48px)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Comparison */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          {/* White Background */}
          <div className="bg-white rounded-xl shadow-lg shadow-purple-100/50 p-8 border border-purple-100">
            <h3 className="text-purple-900 mb-4 text-center">白背景</h3>
            <div className="flex items-center justify-center">
              <EdBrioFinalLogo size={120} />
            </div>
          </div>

          {/* Dark Background */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-lg shadow-gray-500/50 p-8 border border-gray-700">
            <h3 className="text-white mb-4 text-center">ダーク背景</h3>
            <div className="flex items-center justify-center">
              <EdBrioFinalLogo size={120} />
            </div>
          </div>
        </div>

        {/* Design Features */}
        <div className="bg-white rounded-xl shadow-lg shadow-purple-100/50 p-8 border border-purple-100 max-w-3xl mb-12">
          <h3 className="text-purple-900 mb-4 text-center">デザインの特徴</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-purple-800/70">
            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-lg">
              <span className="text-2xl">📚</span>
              <div>
                <div className="mb-1">開いた本</div>
                <p className="text-sm text-purple-600/60">学びと知識の象徴</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-lg">
              <span className="text-2xl">🎓</span>
              <div>
                <div className="mb-1">卒業帽子</div>
                <p className="text-sm text-purple-600/60">教育と達成の表現</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-lg">
              <span className="text-2xl">💜</span>
              <div>
                <div className="mb-1">パープル→ピンク</div>
                <p className="text-sm text-purple-600/60">信頼感と親しみやすさ</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-lg">
              <span className="text-2xl">⭕</span>
              <div>
                <div className="mb-1">円形デザイン</div>
                <p className="text-sm text-purple-600/60">完全性と調和</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Note */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 max-w-3xl mb-12">
          <h3 className="text-purple-900 mb-3 text-center">使用方法</h3>
          <div className="text-purple-800/80 text-sm space-y-2">
            <p className="text-center">
              このロゴは <code className="bg-white px-2 py-1 rounded text-purple-600">/components/EdBrioFinalLogo.tsx</code> に保存されています
            </p>
            <div className="bg-white rounded p-4 mt-3">
              <pre className="text-xs overflow-x-auto">
{`import { EdBrioFinalLogo } from "./components/EdBrioFinalLogo";

// 使用例
<EdBrioFinalLogo size={120} />
<EdBrioFinalLogo size={48} className="my-custom-class" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
