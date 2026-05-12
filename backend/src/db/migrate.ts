import { Migrator } from 'kysely'
import { db } from './connection'
import * as migration001 from './migrations/001_initial_schema'
import * as migration002 from './migrations/002_seed_lookups'
import * as migration003 from './migrations/003_messaging'


export async function runMigrations(): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: {
      getMigrations: async () => ({
        '001_initial_schema': migration001,
        '002_seed_lookups': migration002,
        '003_messaging': migration003,
      }),
    },
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(r => {
    if (r.status === 'Success') {
      console.log(`✓ migration: ${r.migrationName}`)
    } else if (r.status === 'Error') {
      console.error(`✗ migration failed: ${r.migrationName}`)
    }
  })

  if (error) throw error

  console.log('All migrations complete.')
}

if (import.meta.main) {
  await runMigrations().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
