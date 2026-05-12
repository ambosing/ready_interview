import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://user:password@localhost:5432/hirey'),
  JWT_SECRET: z.string().default('your-jwt-secret-here'),
  JWT_REFRESH_SECRET: z.string().default('your-jwt-refresh-secret-here'),
})

const parsedEnv = envSchema.parse(process.env)

export const config = {
  env: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  port: parsedEnv.PORT,
  frontendUrl: parsedEnv.FRONTEND_URL,
  databaseUrl: parsedEnv.DATABASE_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
} as const

export type AppConfig = typeof config
