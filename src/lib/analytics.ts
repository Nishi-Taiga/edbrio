/**
 * GA4 conversion event tracking utility.
 * Each event corresponds to a key conversion action defined in LAUNCH-PLAN.md.
 */

type GA4Event =
  | { name: 'sign_up'; params: { method: 'email' | 'google'; role: 'teacher' | 'guardian' } }
  | { name: 'cta_click'; params: { location: string } }
  | { name: 'contact_submit' }
  | { name: 'ticket_purchase'; params: { ticket_id: string } }
  | { name: 'report_generate'; params: { tokens_used?: number } }
  | { name: 'pre_register'; params: { location: string } }

export function trackEvent(event: GA4Event): void {
  if (typeof window === 'undefined' || !window.gtag) return

  const { name, ...rest } = event
  window.gtag('event', name, 'params' in rest ? rest.params : undefined)
}
