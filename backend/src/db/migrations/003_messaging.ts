/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from 'kysely'

const NOW = sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`

export async function up(db: Kysely<any>): Promise<void> {
  // ── Conversations ─────────────────────────────────────────────────────────

  await db.schema.createTable('conversations').ifNotExists()
    .addColumn('conversation_id', 'text', c => c.primaryKey())
    .addColumn('type', 'text', c => c.notNull().defaultTo('direct'))
    .addColumn('title', 'text') // null for DMs, used for groups/broadcasts
    .addColumn('dm_pair_hash', 'text', c => c.unique()) // "uuid_a:uuid_b" sorted
    .addColumn('created_by', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addColumn('updated_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_conv_type', sql`type IN ('direct','group','broadcast')`)
    .execute()

  // ── Conversation Participants ─────────────────────────────────────────────

  await db.schema.createTable('conversation_participants').ifNotExists()
    .addColumn('participant_id', 'text', c => c.primaryKey())
    .addColumn('conversation_id', 'text', c => c.notNull().references('conversations.conversation_id').onDelete('cascade'))
    .addColumn('user_id', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('role', 'text', c => c.notNull().defaultTo('member'))
    .addColumn('last_read_at', 'text') // ISO timestamp of last read
    .addColumn('is_active', 'integer', c => c.notNull().defaultTo(1))
    .addColumn('joined_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_cp_role', sql`role IN ('member','admin','owner')`)
    .addCheckConstraint('ck_cp_active', sql`is_active IN (0,1)`)
    .addUniqueConstraint('uq_conv_user', ['conversation_id', 'user_id'])
    .execute()

  // ── Messages ──────────────────────────────────────────────────────────────

  await db.schema.createTable('messages').ifNotExists()
    .addColumn('message_id', 'text', c => c.primaryKey())
    .addColumn('conversation_id', 'text', c => c.notNull().references('conversations.conversation_id').onDelete('cascade'))
    .addColumn('sender_id', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('message_type', 'text', c => c.notNull().defaultTo('text'))
    .addColumn('content', 'text') // null for attachment-only messages
    .addColumn('reply_to_id', 'text', c => c.references('messages.message_id'))
    .addColumn('is_edited', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('edited_at', 'text')
    .addColumn('is_deleted', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('deleted_at', 'text')
    .addColumn('metadata', 'text') // JSON string for extensibility
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_msg_type', sql`message_type IN ('text','image','video','file','system')`)
    .addCheckConstraint('ck_msg_edited', sql`is_edited IN (0,1)`)
    .addCheckConstraint('ck_msg_deleted', sql`is_deleted IN (0,1)`)
    .execute()

  // ── Message Attachments ───────────────────────────────────────────────────

  await db.schema.createTable('message_attachments').ifNotExists()
    .addColumn('attachment_id', 'text', c => c.primaryKey())
    .addColumn('message_id', 'text', c => c.notNull().references('messages.message_id').onDelete('cascade'))
    .addColumn('file_name', 'text', c => c.notNull())
    .addColumn('mime_type', 'text', c => c.notNull())
    .addColumn('size_bytes', 'integer', c => c.notNull())
    .addColumn('data_uri', 'text', c => c.notNull()) // data:<mime>;base64,<content>
    .addColumn('preview_uri', 'text') // thumbnail data URI for images/videos
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .execute()

  // ── Indexes ───────────────────────────────────────────────────────────────

  // Conversation lookups
  await db.schema.createIndex('idx_conv_dm_pair').ifNotExists()
    .on('conversations').column('dm_pair_hash').execute()

  // Participant lookups — find all conversations for a user
  await db.schema.createIndex('idx_cp_user_id').ifNotExists()
    .on('conversation_participants').column('user_id').execute()
  await db.schema.createIndex('idx_cp_conv_id').ifNotExists()
    .on('conversation_participants').column('conversation_id').execute()

  // Message queries — pagination by conversation + time
  await db.schema.createIndex('idx_msg_conv_created').ifNotExists()
    .on('messages').columns(['conversation_id', 'created_at']).execute()
  await db.schema.createIndex('idx_msg_sender').ifNotExists()
    .on('messages').column('sender_id').execute()

  // Attachment lookup by message
  await db.schema.createIndex('idx_attach_msg_id').ifNotExists()
    .on('message_attachments').column('message_id').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of [
    'message_attachments', 'messages',
    'conversation_participants', 'conversations',
  ]) {
    await db.schema.dropTable(table).ifExists().execute()
  }
}
