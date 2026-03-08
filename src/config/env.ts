export const ENV = {
  AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8001/api/v1',
  TICKETING_API_URL: import.meta.env.VITE_TICKETING_API_URL || 'http://localhost:8000',
  APP_NAME: 'Ticketing Genie',
} as const

export type EnvConfig = typeof ENV
