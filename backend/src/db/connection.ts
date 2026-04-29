import { Kysely } from 'kysely'
import { BunSqliteDialect } from 'kysely-bun-sqlite'
import { Database as BunDB } from 'bun:sqlite'
import type { Database } from './schema'

const sqliteDb = new BunDB(process.env['DB_PATH'] ?? './sportlink.db')
sqliteDb.exec('PRAGMA foreign_keys = ON')
sqliteDb.exec('PRAGMA journal_mode = WAL')

export const db = new Kysely<Database>({
  dialect: new BunSqliteDialect({ database: sqliteDb }),
})
