import { Elysia } from 'elysia'
import { db } from '../../db/connection'

export const lookupRoutes = new Elysia()

  // GET /api/sports
  .get('/sports', async () => {
    const rows = await db
      .selectFrom('sports')
      .select(['sport_id', 'sport_name'])
      .orderBy('sport_name', 'asc')
      .execute()
    return { data: rows.map(r => ({ id: r.sport_id, name: r.sport_name })) }
  })

  // GET /api/tournaments
  .get('/tournaments', async () => {
    const rows = await db
      .selectFrom('tournaments')
      .select(['tournament_id', 'tournament_name','level'])
      .orderBy('tournament_name', 'asc')
      .execute()
    return { data: rows.map(r => ({ id: r.tournament_id, name: r.tournament_name, level: r.level })) }
  })
