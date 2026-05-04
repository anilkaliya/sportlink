import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { runMigrations } from './db/migrate'
import { athleteRoutes } from './modules/athlete/athlete.routes'
import { userRoutes } from './modules/users/user.routes'
import { lookupRoutes } from './modules/lookups/lookups.routes'
import { connectionRoutes } from './modules/connections/connections.routes'
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

const app = new Elysia()

  .onRequest(({ request, set }) => {
    console.log('Incoming:', request.method, request.url)
    if (request.method === 'OPTIONS') {
      set.status = 204
      return ''
    }
  })
  .use(cors({
    origin: 'http://localhost:5174',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }))
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
    .get('/health', () => ({ status: 'ok' }))
  )

  .listen(3000)

console.log('Server running on http://localhost:3000')
