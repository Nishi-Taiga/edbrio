import { vi } from 'vitest'

interface SentEmail {
  from: string
  to: string
  subject: string
  html: string
}

/**
 * Creates a mock for the Resend email service.
 * Captures sent emails for assertion.
 */
export function createMockResend() {
  const sentEmails: SentEmail[] = []

  const mock = {
    emails: {
      send: vi.fn().mockImplementation(async (params: SentEmail) => {
        sentEmails.push(params)
        return { data: { id: `email_${Date.now()}` }, error: null }
      }),
    },
  }

  return { mock, sentEmails }
}
