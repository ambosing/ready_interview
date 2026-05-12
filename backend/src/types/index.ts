export type AuthContext = {
  userId?: string
  email?: string
  role?: string
  token?: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

export {}
