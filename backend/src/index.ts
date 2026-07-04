import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { runMigrations } from './db/migrate'
import { athleteRoutes } from './modules/athlete/athlete.routes'
import { userRoutes } from './modules/users/user.routes'
import { lookupRoutes } from './modules/lookups/lookups.routes'
import { connectionRoutes } from './modules/connections/connections.routes'
import { messagingRoutes } from './modules/messaging/messaging.routes'
import { messagingWs } from './modules/messaging/messaging.ws'
import { authGuard } from './shared/auth-guard'

// Paths that do not require a valid access token
const PUBLIC_PATHS = new Set([
  '/api/user/register',
  '/api/user/login',
  '/api/user/refresh',
  '/api/user/logout',
  '/api/health',
  '/api/sports',
  '/api/tournaments',
])

await runMigrations()

// Allowed CORS origins — comma-separated list via env, or "*" to allow any.
// Falls back to the local web dev origin when unset.
const corsEnv = process.env['CORS_ORIGIN'] ?? 'http://localhost:5174'
const corsOrigin: string | string[] | boolean =
  corsEnv.trim() === '*'
    ? true
    : corsEnv.split(',').map(o => o.trim()).filter(Boolean)

const app = new Elysia()

  .onRequest(({ request, set }) => {
    console.log('Incoming:', request.method, request.url)
    if (request.method === 'OPTIONS') {
      set.status = 204
      return ''
    }
  })
  .use(cors({
    origin: corsOrigin,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }))
  .use(messagingWs)
  .group('/api', group => group
    .onBeforeHandle(({ request, headers, set }) => {
      const { pathname } = new URL(request.url)
      if (PUBLIC_PATHS.has(pathname)) return
      return authGuard({ headers, set })
    })
    .use(athleteRoutes)
    .use(userRoutes)
    .use(lookupRoutes)
    .use(connectionRoutes)
    .use(messagingRoutes)
    .get('/health', () => ({ status: 'ok' }))
  )

  .listen(3000)

console.log('Server running on http://localhost:3000')

// Auto-seed test users in dev mode (runs after server is listening)
if (process.env.NODE_ENV !== 'production') {
  import('./db/seed')
    .then(m => m.seed())
    .catch(err => console.warn('Seed skipped:', err.message))
}
