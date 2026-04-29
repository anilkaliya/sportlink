import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { runMigrations } from './db/migrate'
import { athleteRoutes } from './modules/athlete/athlete.routes'
import { userRoutes } from './modules/users/user.routes'
import { lookupRoutes } from './modules/lookups/lookups.routes'

await runMigrations()

const app = new Elysia()

  // ✅ THIS is the real fix
  .onRequest(({ request, set }) => {
      console.log('Incoming:', request.method, request.url)

    if (request.method === 'OPTIONS') {
      set.status = 204
      return ''
    }
  })
  .use(cors({
    origin: 'http://localhost:5174',
    allowedHeaders: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }))
  .group('/api', group => group
    .use(athleteRoutes)
    .use(userRoutes)
    .use(lookupRoutes)
    .get('/health', () => ({ status: 'ok' }))
  )

  .listen(3000)
  console.log('Server running on http://localhost:3000')
