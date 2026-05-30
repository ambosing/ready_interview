import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const placeholderSecrets = new Set([
  'secret',
  'refresh_secret',
  'your-jwt-secret-here',
  'your-jwt-refresh-secret-here',
])

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('file:./prisma/dev.db'),
  JWT_SECRET: z.string().min(32).default('dev-only-jwt-secret-change-before-production'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-only-refresh-secret-change-before-production'),
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') {
    return
  }

  if (placeholderSecrets.has(env.JWT_SECRET) || env.JWT_SECRET.startsWith('dev-only-')) {
    ctx.addIssue({
      code: 'custom',
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET must be set to a strong non-default value in production',
    })
  }

  if (
    placeholderSecrets.has(env.JWT_REFRESH_SECRET) ||
    env.JWT_REFRESH_SECRET.startsWith('dev-only-')
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET must be set to a strong non-default value in production',
    })
  }
})

const parsedEnv = envSchema.parse(process.env)

export const config = {
  env: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  port: parsedEnv.PORT,
  frontendUrl: parsedEnv.FRONTEND_URL,
  corsOrigins: [parsedEnv.FRONTEND_URL],
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
} as const

export type AppConfig = typeof config
