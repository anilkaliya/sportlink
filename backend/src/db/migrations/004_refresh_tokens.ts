import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('refresh_tokens')
    .ifNotExists()
    .addColumn('token_hash', 'text', col => col.primaryKey().notNull())
    .addColumn('user_id', 'text', col =>
      col.notNull().references('users.user_id').onDelete('cascade')
    )
    .addColumn('expires_at', 'text', col => col.notNull())
    .addColumn('created_at', 'text', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('idx_rt_user_id')
    .on('refresh_tokens')
    .column('user_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_rt_user_id').execute()
  await db.schema.dropTable('refresh_tokens').execute()
}
