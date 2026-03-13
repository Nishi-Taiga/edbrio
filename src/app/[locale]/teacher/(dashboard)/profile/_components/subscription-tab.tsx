'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getStripe } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { TeacherRow } from './types'

interface SubscriptionTabProps {
  teacher: TeacherRow
  setError: (error: string | null) => void
}

export function SubscriptionTab({ teacher, setError }: SubscriptionTabProps) {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')

  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [isStripeOnboarding, setIsStripeOnboarding] = useState(false)
  const [showStripeHelpModal, setShowStripeHelpModal] = useState(false)

  const handleUpgrade = async () => {
    setIsSubscriptionLoading(true)
    try {
      const res = await fetch('/api/checkout/subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const stripeClient = await getStripe()
      if (stripeClient) {
        await stripeClient.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError(err instanceof Error ? err.message : t('upgradeError'))
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const handleStripeOnboard = async () => {
    setIsStripeOnboarding(true)
    try {
      const res = await fetch('/api/stripe/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        console.error('Stripe onboard error:', data.error)
        toast.error(data.error || t('stripeConnectRefresh'))
        return
      }
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Stripe onboarding error:', err)
      toast.error(t('stripeConnectRefresh'))
    } finally {
      setIsStripeOnboarding(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsSubscriptionLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error ? err.message : t('portalError'))
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  return (
    <>
      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('stripeConnectTitle')}
          </CardTitle>
          <CardDescription>{t('stripeConnectDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.stripe_account_id ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {t('stripeStatusConnected')}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {t('stripeStatusNotConnected')}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleStripeOnboard} disabled={isStripeOnboarding}>
                  {isStripeOnboarding ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {t('stripeModalConnecting')}</>
                  ) : (
                    <><CreditCard className="w-4 h-4 mr-1" /> {t('stripeConnectButton')}</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowStripeHelpModal(true)}>
                  {t('stripeHowToConnect')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan / Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>{t('planTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.plan === 'standard' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/30">
                <div className="flex items-center gap-2">
                  <Badge className="bg-brand-600 text-white">Standard</Badge>
                  <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    {t('standardPlanLabel')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isSubscriptionLoading}
                >
                  {isSubscriptionLoading ? tc('loading') : t('manageSubscription')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-surface border border-gray-200 dark:border-brand-800/20">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Free</Badge>
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  {t('freePlanFeeLabel')}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleUpgrade}
                disabled={isSubscriptionLoading}
              >
                {isSubscriptionLoading ? tc('processing') : t('upgradeButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t('planComparisonTitle')}</CardTitle>
          <CardDescription>{t('planComparisonDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-slate-300">{t('featureColumn')}</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500 dark:text-slate-400">{t('freeColumn')}</th>
                  <th className="text-center py-3 pl-4 font-semibold text-brand-600 dark:text-brand-400">{t('standardColumn')}</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-slate-300">
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureStudents')}</td>
                  <td className="text-center py-3 px-4">{t('featureStudentsFree')}</td>
                  <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">{t('featureStudentsStandard')}</td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureAiReports')}</td>
                  <td className="text-center py-3 px-4">{t('featureAiReportsFree')}</td>
                  <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">{t('featureAiReportsStandard')}</td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureCalendar')}</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                  <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureStripe')}</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-emerald-500" /></td>
                  <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureFee')}</td>
                  <td className="text-center py-3 px-4">10.6%</td>
                  <td className="text-center py-3 pl-4 font-semibold text-brand-700 dark:text-brand-300">5%</td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureKarte')}</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                  <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                </tr>
                <tr className="border-b border-dashed">
                  <td className="py-3 pr-4">{t('featureChat')}</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                  <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">{t('featurePrioritySupport')}</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-600" /></td>
                  <td className="text-center py-3 pl-4"><Check className="w-4 h-4 mx-auto text-brand-600 dark:text-brand-400" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {teacher.plan !== 'standard' && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleUpgrade} disabled={isSubscriptionLoading}>
                {isSubscriptionLoading ? tc('processing') : t('upgradeButtonWithTrial')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Connect Help Modal */}
      <Dialog open={showStripeHelpModal} onOpenChange={setShowStripeHelpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('stripeModalTitle')}</DialogTitle>
            <DialogDescription>{t('stripeModalDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t('stripeModalStep1Title')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep1Desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t('stripeModalStep2Title')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep2Desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t('stripeModalStep3Title')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep3Desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">4</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t('stripeModalStep4Title')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep4Desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">5</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t('stripeModalStep5Title')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('stripeModalStep5Desc')}</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">{t('stripeModalNote')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStripeHelpModal(false)}>
              {tc('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
