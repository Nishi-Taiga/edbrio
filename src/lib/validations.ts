import { z } from 'zod'

// ── 共通 ──

const uuidSchema = z.string().uuid()
const emailSchema = z.string().email().max(254)

// ── /api/contact ──

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  message: z.string().min(1).max(5000),
})

// ── /api/auth/login ──

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
})

// ── /api/ai/generate-report ──

export const generateReportSchema = z.object({
  contentRaw: z.string().min(1).max(10000),
  studentName: z.string().min(1).max(100),
  subject: z.string().max(50).optional(),
  goals: z.array(z.string().max(200)).max(10).optional(),
  weakPoints: z.array(z.string().max(200)).max(10).optional(),
  comprehensionLevel: z.number().int().min(1).max(5).optional(),
  studentMood: z.enum(['good', 'neutral', 'tired', 'unmotivated']).optional(),
  maxLength: z.number().int().min(100).max(2000).optional(),
})

// ── /api/email/send ──

export const emailSendSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('booking_confirmation'),
    data: z.object({
      bookingId: uuidSchema,
    }),
  }),
  z.object({
    type: z.literal('report_published'),
    data: z.object({
      reportId: uuidSchema,
    }),
  }),
  z.object({
    type: z.literal('new_chat_message'),
    data: z.object({
      conversationId: uuidSchema,
    }),
  }),
])

// ── /api/invites ──

export const inviteCreateSchema = z
  .object({
    email: emailSchema.optional(),
    method: z.enum(['email', 'qr']).default('email'),
  })
  .refine(
    (data) => data.method !== 'email' || !!data.email,
    { message: 'email is required for email invites', path: ['email'] }
  )

// ── /api/invites/validate ──

export const inviteValidateSchema = z.object({
  token: uuidSchema,
})

// ── /api/invites/accept ──

export const inviteAcceptSchema = z.object({
  token: uuidSchema,
})

// ── /api/checkout/session ──

export const checkoutSessionSchema = z.object({
  ticketId: uuidSchema,
  priceId: z.string().min(1).max(255),
})

// ── /api/auth/forgot-password ──

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// ── /api/auth/reset-password ──

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(72),
})

// ── /api/admin/users (query params) ──

export const adminUsersQuerySchema = z.object({
  role: z.enum(['all', 'teacher', 'guardian', 'student']).default('all'),
  plan: z.enum(['all', 'free', 'pro']).default('all'),
  search: z.string().max(100).default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['newest', 'oldest']).default('newest'),
})

// ── /api/admin/users/[id] PATCH ──

export const adminUserUpdateSchema = z
  .object({
    plan: z.enum(['free', 'pro']).optional(),
    is_suspended: z.boolean().optional(),
  })
  .refine(
    (data) => data.plan !== undefined || data.is_suspended !== undefined,
    { message: 'No update fields provided.' }
  )
