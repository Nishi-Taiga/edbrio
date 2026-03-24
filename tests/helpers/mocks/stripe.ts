import { vi } from 'vitest'

/**
 * Creates a mock Stripe instance for testing webhook and checkout flows.
 */
export function createMockStripe() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn().mockImplementation(() => ({
        type: 'checkout.session.completed',
        data: { object: {} },
      })),
    },
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test_123' }),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_test_123',
        status: 'active',
      }),
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
  }
}

/**
 * Builds a mock Stripe webhook event.
 */
export function buildStripeEvent(
  type: string,
  data: Record<string, unknown> = {}
) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2024-04-10',
  }
}
