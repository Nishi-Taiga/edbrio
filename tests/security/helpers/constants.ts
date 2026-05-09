/**
 * Security test constants
 * Tests run against local dev server only — never production
 */

export const BASE_URL = process.env.SECURITY_TEST_BASE_URL || 'http://localhost:3000'

// Test account credentials (must be created in local Supabase)
export const TEST_TEACHER = {
  email: process.env.TEST_TEACHER_EMAIL || 'teacher@test.com',
  password: process.env.TEST_TEACHER_PASSWORD || 'testpassword123',
}

export const TEST_GUARDIAN = {
  email: process.env.TEST_GUARDIAN_EMAIL || 'guardian@test.com',
  password: process.env.TEST_GUARDIAN_PASSWORD || 'testpassword123',
}

// API route paths organized by category
export const ROUTES = {
  // Auth
  login: '/api/auth/login',
  callback: '/api/auth/callback',

  // Public (no auth required by design)
  contact: '/api/contact',
  preRegister: '/api/pre-register',
  preRegisterConfirm: '/api/pre-register/confirm',
  areas: '/api/areas',

  // Authenticated
  checkout: '/api/checkout/session',
  checkoutSubscription: '/api/checkout/subscription',
  bookingReports: '/api/booking-reports',
  ticketBalanceAdjust: '/api/ticket-balance/adjust',
  ticketGrant: '/api/teacher/tickets/grant',
  aiReport: '/api/ai/generate-report',
  emailSend: '/api/email/send',
  announcements: '/api/announcements',
  announcementsRead: '/api/announcements/read',
  notificationPreferences: '/api/notification-preferences',
  accountDelete: '/api/account/delete',
  invites: '/api/invites',
  invitesAccept: '/api/invites/accept',
  invitesValidate: '/api/invites/validate',
  stripeOnboard: '/api/stripe/onboard',
  stripePortal: '/api/stripe/portal',

  // Admin
  adminUsers: '/api/admin/users',
  adminAudit: '/api/admin/audit',
  adminBookings: '/api/admin/bookings',
  adminPayments: '/api/admin/payments',
  adminReports: '/api/admin/reports',
  adminStats: '/api/admin/stats',
  adminStatsTrends: '/api/admin/stats/trends',
  adminTickets: '/api/admin/tickets',
  adminAnnouncements: '/api/admin/announcements',

  // Cron
  cronCleanup: '/api/cron/cleanup-chat-images',
  cronAutoApprove: '/api/cron/auto-approve-reports',
  cronReminder: '/api/cron/booking-reminder',
} as const

// Routes that MUST require authentication (any auth)
export const AUTHENTICATED_ROUTES: Array<{ path: string; method: string }> = [
  { path: ROUTES.bookingReports, method: 'GET' },
  { path: ROUTES.bookingReports, method: 'POST' },
  { path: ROUTES.ticketBalanceAdjust, method: 'POST' },
  { path: ROUTES.ticketGrant, method: 'POST' },
  { path: ROUTES.aiReport, method: 'POST' },
  { path: ROUTES.emailSend, method: 'POST' },
  { path: ROUTES.announcements, method: 'GET' },
  { path: ROUTES.announcementsRead, method: 'POST' },
  { path: ROUTES.notificationPreferences, method: 'GET' },
  { path: ROUTES.notificationPreferences, method: 'PUT' },
  { path: ROUTES.accountDelete, method: 'DELETE' },
  { path: ROUTES.invites, method: 'POST' },
  { path: ROUTES.invitesAccept, method: 'POST' },
  { path: ROUTES.stripeOnboard, method: 'POST' },
  { path: ROUTES.stripePortal, method: 'POST' },
  { path: ROUTES.checkout, method: 'POST' },
  { path: ROUTES.checkoutSubscription, method: 'POST' },
]

// Routes that MUST require admin access
export const ADMIN_ROUTES: Array<{ path: string; method: string }> = [
  { path: ROUTES.adminUsers, method: 'GET' },
  { path: ROUTES.adminAudit, method: 'GET' },
  { path: ROUTES.adminBookings, method: 'GET' },
  { path: ROUTES.adminPayments, method: 'GET' },
  { path: ROUTES.adminReports, method: 'GET' },
  { path: ROUTES.adminStats, method: 'GET' },
  { path: ROUTES.adminStatsTrends, method: 'GET' },
  { path: ROUTES.adminTickets, method: 'GET' },
  { path: ROUTES.adminAnnouncements, method: 'GET' },
  { path: ROUTES.adminAnnouncements, method: 'POST' },
]

// Severity levels for findings
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export interface SecurityFinding {
  id: string
  severity: Severity
  category: string
  title: string
  description: string
  evidence: string
  file?: string
  remediation: string
}
