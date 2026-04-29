/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from 'kysely'

// Fixed UUIDs ensure tournament FK → sport references remain stable across re-runs
const S = {
  athletics:    'a0000001-0000-4000-8000-000000000001',
  badminton:    'a0000001-0000-4000-8000-000000000002',
  boxing:       'a0000001-0000-4000-8000-000000000003',
  cricket:      'a0000001-0000-4000-8000-000000000004',
  field_hockey: 'a0000001-0000-4000-8000-000000000005',
  football:     'a0000001-0000-4000-8000-000000000006',
  kabaddi:      'a0000001-0000-4000-8000-000000000007',
  shooting:     'a0000001-0000-4000-8000-000000000008',
  swimming:     'a0000001-0000-4000-8000-000000000009',
  table_tennis: 'a0000001-0000-4000-8000-00000000000a',
  tennis:       'a0000001-0000-4000-8000-00000000000b',
  volleyball:   'a0000001-0000-4000-8000-00000000000c',
  weightlifting:'a0000001-0000-4000-8000-00000000000d',
  wrestling:    'a0000001-0000-4000-8000-00000000000e',
  basketball:   'a0000001-0000-4000-8000-00000000000f',
}

export async function up(db: Kysely<any>): Promise<void> {
  await db.insertInto('sports').values([
    { sport_id: S.athletics,     sport_name: 'Athletics',     sport_category: 'individual', governing_body: 'Athletics Federation of India',        has_personal_bests: 1, icon_url: null },
    { sport_id: S.badminton,     sport_name: 'Badminton',     sport_category: 'racket',     governing_body: 'Badminton Association of India',        has_personal_bests: 0, icon_url: null },
    { sport_id: S.boxing,        sport_name: 'Boxing',        sport_category: 'combat',     governing_body: 'Boxing Federation of India',            has_personal_bests: 0, icon_url: null },
    { sport_id: S.cricket,       sport_name: 'Cricket',       sport_category: 'team',       governing_body: 'Board of Control for Cricket in India', has_personal_bests: 0, icon_url: null },
    { sport_id: S.field_hockey,  sport_name: 'Field Hockey',  sport_category: 'team',       governing_body: 'Hockey India',                          has_personal_bests: 0, icon_url: null },
    { sport_id: S.football,      sport_name: 'Football',      sport_category: 'team',       governing_body: 'All India Football Federation',         has_personal_bests: 0, icon_url: null },
    { sport_id: S.kabaddi,       sport_name: 'Kabaddi',       sport_category: 'combat',     governing_body: 'Amateur Kabaddi Federation of India',   has_personal_bests: 0, icon_url: null },
    { sport_id: S.shooting,      sport_name: 'Shooting',      sport_category: 'individual', governing_body: 'National Rifle Association of India',   has_personal_bests: 1, icon_url: null },
    { sport_id: S.swimming,      sport_name: 'Swimming',      sport_category: 'aquatic',    governing_body: 'Swimming Federation of India',          has_personal_bests: 1, icon_url: null },
    { sport_id: S.table_tennis,  sport_name: 'Table Tennis',  sport_category: 'racket',     governing_body: 'Table Tennis Federation of India',      has_personal_bests: 0, icon_url: null },
    { sport_id: S.tennis,        sport_name: 'Tennis',        sport_category: 'racket',     governing_body: 'All India Tennis Association',          has_personal_bests: 0, icon_url: null },
    { sport_id: S.volleyball,    sport_name: 'Volleyball',    sport_category: 'team',       governing_body: 'Volleyball Federation of India',        has_personal_bests: 0, icon_url: null },
    { sport_id: S.weightlifting, sport_name: 'Weightlifting', sport_category: 'individual', governing_body: 'Indian Weightlifting Federation',       has_personal_bests: 1, icon_url: null },
    { sport_id: S.wrestling,     sport_name: 'Wrestling',     sport_category: 'combat',     governing_body: 'Wrestling Federation of India',         has_personal_bests: 0, icon_url: null },
    { sport_id: S.basketball,    sport_name: 'Basketball',    sport_category: 'team',       governing_body: 'Basketball Federation of India',        has_personal_bests: 0, icon_url: null },
  ]).onConflict(oc => oc.column('sport_name').doNothing()).execute()

  await db.insertInto('tournaments').values([
    { tournament_id: 'b0000001-0000-4000-8000-000000000001', tournament_name: 'Ranji Trophy',                           sport_id: S.cricket,       level: 'national',      organizing_body: 'BCCI' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000002', tournament_name: 'Vijay Hazare Trophy',                    sport_id: S.cricket,       level: 'national',      organizing_body: 'BCCI' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000003', tournament_name: 'Hockey India League',                    sport_id: S.field_hockey,  level: 'national',      organizing_body: 'Hockey India' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000004', tournament_name: 'FIH Hockey World Cup',                   sport_id: S.field_hockey,  level: 'international', organizing_body: 'FIH' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000005', tournament_name: 'BWF World Championships',                sport_id: S.badminton,     level: 'international', organizing_body: 'BWF' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000006', tournament_name: 'Yonex-Sunrise India Open',               sport_id: S.badminton,     level: 'international', organizing_body: 'BAI' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000007', tournament_name: 'Senior National Athletics Championship', sport_id: S.athletics,     level: 'national',      organizing_body: 'Athletics Federation of India' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000008', tournament_name: 'Santosh Trophy',                         sport_id: S.football,      level: 'national',      organizing_body: 'AIFF' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000009', tournament_name: 'Durand Cup',                             sport_id: S.football,      level: 'national',      organizing_body: 'Durand Football Tournament Society' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000a', tournament_name: 'Pro Kabaddi League',                     sport_id: S.kabaddi,       level: 'national',      organizing_body: 'Mashal Sports' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000b', tournament_name: 'Senior National Kabaddi Championship',   sport_id: S.kabaddi,       level: 'national',      organizing_body: 'AKFI' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000c', tournament_name: 'National Shooting Championship',         sport_id: S.shooting,      level: 'national',      organizing_body: 'NRAI' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000d', tournament_name: 'ISSF World Cup India',                   sport_id: S.shooting,      level: 'international', organizing_body: 'ISSF' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000e', tournament_name: 'National Swimming Championship',         sport_id: S.swimming,      level: 'national',      organizing_body: 'Swimming Federation of India' },
    { tournament_id: 'b0000001-0000-4000-8000-00000000000f', tournament_name: 'National Weightlifting Championship',    sport_id: S.weightlifting, level: 'national',      organizing_body: 'Indian Weightlifting Federation' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000010', tournament_name: 'IWF World Championships',                sport_id: S.weightlifting, level: 'international', organizing_body: 'IWF' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000011', tournament_name: 'Senior National Wrestling Championship',  sport_id: S.wrestling,     level: 'national',      organizing_body: 'Wrestling Federation of India' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000012', tournament_name: 'Khelo India Youth Games',                sport_id: null,            level: 'national',      organizing_body: 'Sports Authority of India' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000013', tournament_name: 'Asian Games',                            sport_id: null,            level: 'international', organizing_body: 'Olympic Council of Asia' },
    { tournament_id: 'b0000001-0000-4000-8000-000000000014', tournament_name: 'Commonwealth Games',                     sport_id: null,            level: 'international', organizing_body: 'Commonwealth Games Federation' },
  ]).onConflict(oc => oc.column('tournament_name').doNothing()).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('tournaments').execute()
  await db.deleteFrom('sports').execute()
}
