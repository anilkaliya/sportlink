/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from 'kysely'

// Kysely<any> is the accepted pattern for migrations — schema is unknown at migration time
const NOW = sql`(strftime('%Y-%m-%dT%H:%M:%SZ','now'))`

export async function up(db: Kysely<any>): Promise<void> {
  // ── Lookup tables ──────────────────────────────────────────────────────────

  await db.schema.createTable('sports').ifNotExists()
    .addColumn('sport_id', 'text', c => c.primaryKey())
    .addColumn('sport_name', 'text', c => c.notNull().unique())
    .addColumn('sport_category', 'text', c => c.notNull())
    .addColumn('governing_body', 'text')
    .addColumn('has_personal_bests', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('icon_url', 'text')
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_sports_category', sql`sport_category IN ('individual','team','combat','racket','aquatic','other')`)
    .addCheckConstraint('ck_sports_pb', sql`has_personal_bests IN (0,1)`)
    .execute()

  await db.schema.createTable('tournaments').ifNotExists()
    .addColumn('tournament_id', 'text', c => c.primaryKey())
    .addColumn('tournament_name', 'text', c => c.notNull().unique())
    .addColumn('sport_id', 'text', c => c.references('sports.sport_id'))
    .addColumn('level', 'text', c => c.notNull())
    .addColumn('organizing_body', 'text')
    .addColumn('is_active', 'integer', c => c.notNull().defaultTo(1))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_tournaments_level', sql`level IN ('international','national','state','district')`)
    .addCheckConstraint('ck_tournaments_active', sql`is_active IN (0,1)`)
    .execute()

  // ── Auth ───────────────────────────────────────────────────────────────────

  await db.schema.createTable('users').ifNotExists()
    .addColumn('user_id', 'text', c => c.primaryKey())
    .addColumn('email', 'text', c => c.notNull().unique())
    .addColumn('phone', 'text', c => c.unique())
    .addColumn('password_hash', 'text', c => c.notNull())
    .addColumn('role', 'text', c => c.notNull().defaultTo('athlete'))
    .addColumn('is_active', 'integer', c => c.notNull().defaultTo(1))
    .addColumn('onboarding_step', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addColumn('updated_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_users_role', sql`role IN ('athlete','recruiter','admin')`)
    .addCheckConstraint('ck_users_active', sql`is_active IN (0,1)`)
    .execute()

  await db.schema.createTable('refresh_tokens').ifNotExists()
    .addColumn('token_hash', 'text', c => c.primaryKey().notNull())
    .addColumn('user_id', 'text', c => c.notNull().references('users.user_id').onDelete('cascade'))
    .addColumn('expires_at', 'text', c => c.notNull())
    .addColumn('created_at', 'text', c => c.notNull())
    .execute()

  // ── Core profile ───────────────────────────────────────────────────────────

  await db.schema.createTable('athlete_profiles').ifNotExists()
    .addColumn('athlete_id', 'text', c => c.primaryKey())
    .addColumn('user_id', 'text', c => c.notNull().unique().references('users.user_id'))
    .addColumn('primary_sport_id', 'text', c => c.references('sports.sport_id'))
    .addColumn('first_name', 'text', c => c.notNull().defaultTo(''))
    .addColumn('last_name', 'text', c => c.notNull().defaultTo(''))
    .addColumn('date_of_birth', 'text')
    .addColumn('gender', 'text')
    .addColumn('city', 'text')
    .addColumn('state', 'text')
    .addColumn('country', 'text', c => c.notNull().defaultTo('India'))
    .addColumn('bio', 'text')
    .addColumn('profile_photo_url', 'text')
    .addColumn('profile_status', 'text', c => c.notNull().defaultTo('draft'))
    .addColumn('languages', 'text')
    .addColumn('is_still_competing', 'integer', c => c.notNull().defaultTo(1))
    .addColumn('is_open_to_work', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addColumn('updated_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_ap_gender', sql`gender IS NULL OR gender IN ('male','female','other')`)
    .addCheckConstraint('ck_ap_status', sql`profile_status IN ('draft','active','suspended')`)
    .addCheckConstraint('ck_ap_competing', sql`is_still_competing IN (0,1)`)
    .addCheckConstraint('ck_ap_open', sql`is_open_to_work IN (0,1)`)
    .execute()

  await db.schema.createTable('sports_passport').ifNotExists()
    .addColumn('passport_id', 'text', c => c.primaryKey())
    .addColumn('athlete_id', 'text', c => c.notNull().references('athlete_profiles.athlete_id'))
    .addColumn('sport_id', 'text', c => c.notNull().references('sports.sport_id'))
    .addColumn('tournament_id', 'text', c => c.references('tournaments.tournament_id'))
    .addColumn('tournament_name_override', 'text')
    .addColumn('level_override', 'text')
    .addColumn('year', 'integer', c => c.notNull())
    .addColumn('medal', 'text')
    .addColumn('is_personal_best', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('pb_value', 'real')
    .addColumn('pb_unit', 'text')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_sp_ref', sql`tournament_id IS NOT NULL OR (tournament_name_override IS NOT NULL AND level_override IS NOT NULL)`)
    .addCheckConstraint('ck_sp_medal', sql`medal IS NULL OR medal IN ('gold','silver','bronze','none')`)
    .addCheckConstraint('ck_sp_pb', sql`is_personal_best IN (0,1)`)
    .addCheckConstraint('ck_sp_pb_unit', sql`pb_unit IS NULL OR pb_unit IN ('seconds','meters','kg','points','other')`)
    .addCheckConstraint('ck_sp_level_override', sql`level_override IS NULL OR level_override IN ('international','national','state','district')`)
    .execute()

  await db.schema.createTable('verification_badges').ifNotExists()
    .addColumn('badge_id', 'text', c => c.primaryKey())
    .addColumn('athlete_id', 'text', c => c.notNull().references('athlete_profiles.athlete_id'))
    .addColumn('sport_id', 'text', c => c.notNull().references('sports.sport_id'))
    .addColumn('verification_type', 'text', c => c.notNull())
    .addColumn('status', 'text', c => c.notNull().defaultTo('pending'))
    .addColumn('rejection_reason', 'text')
    .addColumn('document_url', 'text')
    .addColumn('issued_by', 'text')
    .addColumn('valid_from', 'text')
    .addColumn('valid_until', 'text')
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addColumn('updated_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_vb_type', sql`verification_type IN ('federation','sai','uploaded_cert','manual')`)
    .addCheckConstraint('ck_vb_status', sql`status IN ('pending','approved','rejected')`)
    .addCheckConstraint('ck_vb_rejection', sql`status != 'rejected' OR rejection_reason IS NOT NULL`)
    .execute()

  await db.schema.createTable('athlete_education').ifNotExists()
    .addColumn('education_id', 'text', c => c.primaryKey())
    .addColumn('athlete_id', 'text', c => c.notNull().references('athlete_profiles.athlete_id'))
    .addColumn('institution_name', 'text', c => c.notNull())
    .addColumn('degree', 'text')
    .addColumn('field_of_study', 'text')
    .addColumn('start_year', 'integer')
    .addColumn('end_year', 'integer')
    .addColumn('is_current', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_edu_current', sql`is_current IN (0,1)`)
    .execute()

  await db.schema.createTable('athlete_skills').ifNotExists()
    .addColumn('skill_id', 'text', c => c.primaryKey())
    .addColumn('athlete_id', 'text', c => c.notNull().references('athlete_profiles.athlete_id'))
    .addColumn('skill_name', 'text', c => c.notNull())
    .addColumn('category', 'text', c => c.notNull().defaultTo('sport_specific'))
    .addColumn('endorsement_count', 'integer', c => c.notNull().defaultTo(0))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_skills_category', sql`category IN ('sport_specific','soft_skill','technical','leadership')`)
    .addUniqueConstraint('uq_athlete_skill', ['athlete_id', 'skill_name'])
    .execute()

  // ── Connections ────────────────────────────────────────────────────────────

  // One row per directed request. UNIQUE(sender_id, receiver_id) prevents
  // duplicate requests in the same direction.
  await db.schema.createTable('connection_requests').ifNotExists()
    .addColumn('request_id',  'text', c => c.primaryKey())
    .addColumn('sender_id',   'text', c => c.notNull().references('users.user_id'))
    .addColumn('receiver_id', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('status', 'text', c => c.notNull().defaultTo('pending'))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addColumn('updated_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_cr_status',  sql`status IN ('pending','accepted','rejected','cancelled')`)
    .addCheckConstraint('ck_cr_no_self', sql`sender_id != receiver_id`)
    .addUniqueConstraint('uq_cr_pair',   ['sender_id', 'receiver_id'])
    .execute()

  // Accepted connections stored as an ordered pair so (A,B) == (B,A).
  // user_id_a is always the lexicographically smaller UUID.
  await db.schema.createTable('connections').ifNotExists()
    .addColumn('connection_id', 'text', c => c.primaryKey())
    .addColumn('user_id_a', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('user_id_b', 'text', c => c.notNull().references('users.user_id'))
    .addColumn('created_at', 'text', c => c.notNull().defaultTo(NOW))
    .addCheckConstraint('ck_conn_order', sql`user_id_a < user_id_b`)
    .addUniqueConstraint('uq_conn_pair', ['user_id_a', 'user_id_b'])
    .execute()

  // ── Indexes ────────────────────────────────────────────────────────────────

  await db.schema.createIndex('idx_ap_user_id').ifNotExists().on('athlete_profiles').column('user_id').execute()
  await db.schema.createIndex('idx_ap_open_to_work').ifNotExists().on('athlete_profiles').column('is_open_to_work').execute()
  await db.schema.createIndex('idx_sp_athlete_year').ifNotExists().on('sports_passport').columns(['athlete_id', 'year']).execute()
  await db.schema.createIndex('idx_vb_athlete_id').ifNotExists().on('verification_badges').column('athlete_id').execute()
  await db.schema.createIndex('idx_edu_athlete_id').ifNotExists().on('athlete_education').column('athlete_id').execute()
  await db.schema.createIndex('idx_skills_athlete_id').ifNotExists().on('athlete_skills').column('athlete_id').execute()
  await db.schema.createIndex('idx_rt_user_id').ifNotExists().on('refresh_tokens').column('user_id').execute()
  await db.schema.createIndex('idx_cr_sender').ifNotExists().on('connection_requests').column('sender_id').execute()
  await db.schema.createIndex('idx_cr_receiver').ifNotExists().on('connection_requests').column('receiver_id').execute()
  await db.schema.createIndex('idx_conn_user_a').ifNotExists().on('connections').column('user_id_a').execute()
  await db.schema.createIndex('idx_conn_user_b').ifNotExists().on('connections').column('user_id_b').execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of [
    'connections', 'connection_requests',
    'athlete_skills', 'athlete_education', 'verification_badges',
    'sports_passport', 'athlete_profiles',
    'refresh_tokens', 'users', 'tournaments', 'sports',
  ]) {
    await db.schema.dropTable(table).ifExists().execute()
  }
}
