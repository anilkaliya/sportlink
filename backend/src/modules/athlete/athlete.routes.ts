import { Elysia, t } from 'elysia'
import * as service from './athlete.service'
import { notFound, conflict, validationError, serverError } from '../../shared/errors'
import type { CreateAthleteInput } from './athlete.types'

export const athleteRoutes = new Elysia({ prefix: '/athletes' })

  // GET /athletes — list all athletes
  .get('', async () => {
    const data = await service.getAllAthletes()
    return { data }
  })

  // POST /athletes — create athlete profile
  .post('/', async ({ body, set }) => {
    try {
      const data = await service.createAthlete(body as CreateAthleteInput)
      set.status = 201
      return { data }
    } catch {
      set.status = 400
      return validationError('Invalid input — check user_id and sport_id references')
    }
  }, {
    body: t.Object({
      user_id: t.String({ minLength: 1 }),
      primary_sport_id: t.String(t.String()),
      first_name: t.String(t.String()),
      last_name: t.String(t.String()),
      date_of_birth: t.String(t.String()),
      gender: t.Union([t.Literal('male'), t.Literal('female'), t.Literal('other')]),
      city: t.String(t.String()),
      state: t.String(t.String()),
      country: t.String(t.String()),
      bio: t.Optional(t.String()),
      profile_photo_url: t.Optional(t.String()),
      languages: t.Optional(t.String()),
    }),
  })

  // GET /athletes/:id — fetch profile with passport, education, skills
  .get('/:id', async ({ params, set }) => {
    console.log('Fetching athlete with ID:', params.id)
    const data = await service.getAthleteById(params.id)
    if (!data) { set.status = 404; return notFound('Athlete') }
    return { data }
  }, { params: t.Object({ id: t.String() }) })

  // PATCH /athletes/:id — partial update
  .patch('/:id', async ({ params, body, set }) => {
        console.log('Fetching athlete with ID:', params.id)

    const existing = await service.getAthleteById(params.id)
    if (!existing) { set.status = 404; return notFound('Athlete') }
    try {
      const data = await service.updateAthlete(params.id, body)
      return { data }
    } catch {
      set.status = 500
      return serverError('Update failed')
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      primary_sport_id: t.String(),
      date_of_birth: t.String(),
      gender: t.Union([t.Literal('male'), t.Literal('female'), t.Literal('other')]),
      city: t.String(),
      state: t.String(),
      country: t.String(),
      bio: t.Optional(t.String()),
      profile_photo_url: t.Optional(t.String()),
      profile_status: t.Optional(t.Union([t.Literal('draft'), t.Literal('active'), t.Literal('suspended')])),
      languages: t.Optional(t.String()),
      is_still_competing: t.Optional(t.Union([t.Literal(0), t.Literal(1)])),
      is_open_to_work: t.Optional(t.Union([t.Literal(0), t.Literal(1)])),
    }),
  })

  // GET /athletes/:id/passport
  .get('/:id/passport', async ({ params, set }) => {
    const existing = await service.getAthleteById(params.id)
    if (!existing) { set.status = 404; return notFound('Athlete') }
    const data = await service.getPassport(params.id)
    return { data }
  }, { params: t.Object({ id: t.String() }) })

  // POST /athletes/:id/passport — add passport entry
  .post('/:id/passport', async ({ params, body, set }) => {
    const hasTournament = !!body.tournament_id
    const hasOverride = !!(body.tournament_name_override && body.level_override)
    if (!hasTournament && !hasOverride) {
      set.status = 400
      return validationError('Provide tournament_id OR both tournament_name_override and level_override')
    }
    try {
      const data = await service.addPassportEntry(params.id, body)
      set.status = 201
      return { data }
    } catch {
      set.status = 400
      return validationError('Invalid athlete_id or sport_id reference')
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      sport_id: t.String({ minLength: 1 }),
      tournament_id: t.Optional(t.String()),
      tournament_name_override: t.Optional(t.String()),
      level_override: t.Optional(t.Union([
        t.Literal('international'), t.Literal('national'),
        t.Literal('state'), t.Literal('district'),
      ])),
      year: t.Number({ minimum: 1900, maximum: 2100 }),
      medal: t.Optional(t.Union([
        t.Literal('gold'), t.Literal('silver'), t.Literal('bronze'), t.Literal('none'),
      ])),
      is_personal_best: t.Optional(t.Union([t.Literal(0), t.Literal(1)])),
      pb_value: t.Optional(t.Number()),
      pb_unit: t.Optional(t.Union([
        t.Literal('seconds'), t.Literal('meters'), t.Literal('kg'),
        t.Literal('points'), t.Literal('other'),
      ])),
      notes: t.Optional(t.String()),
    }),
  })

  // GET /athletes/:id/skills
  .get('/:id/skills', async ({ params, set }) => {
    const existing = await service.getAthleteById(params.id)
    if (!existing) { set.status = 404; return notFound('Athlete') }
    const data = await service.getSkills(params.id)
    return { data }
  }, { params: t.Object({ id: t.String() }) })

  // POST /athletes/:id/skills — add one or more skills
  .post('/:id/skills', async ({ params, body, set }) => {
    try {
      const data = await service.addSkills(params.id, body.skills)
      set.status = 201
      return { data }
    } catch {
      set.status = 400
      return validationError('Invalid athlete_id reference')
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      skills: t.Array(t.Object({
        skill_name: t.String({ minLength: 1 }),
        category: t.Optional(t.Union([
          t.Literal('sport_specific'), t.Literal('soft_skill'),
          t.Literal('technical'), t.Literal('leadership'),
        ])),
      }), { minItems: 1 }),
    }),
  })

  // GET /athletes/:id/education
  .get('/:id/education', async ({ params, set }) => {
    const existing = await service.getAthleteById(params.id)
    if (!existing) { set.status = 404; return notFound('Athlete') }
    const data = await service.getEducation(params.id)
    return { data }
  }, { params: t.Object({ id: t.String() }) })

  // POST /athletes/:id/education — add education entry
  .post('/:id/education', async ({ params, body, set }) => {
    try {
      const data = await service.addEducation(params.id, body)
      set.status = 201
      return { data }
    } catch {
      set.status = 400
      return validationError('Invalid athlete_id reference')
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      institution_name: t.String({ minLength: 1 }),
      degree: t.Optional(t.String()),
      field_of_study: t.Optional(t.String()),
      start_year: t.Optional(t.Number()),
      end_year: t.Optional(t.Union([t.Number(), t.Null()])),
      is_current: t.Optional(t.Union([t.Literal(0), t.Literal(1)])),
    }),
  })

  // GET /athletes/:id/pending-actions — profile completion + pending requests
  .get('/:id/pending-actions', async ({ params, set }) => {
    const result = await service.getPendingActions(params.id)
    if ('error' in result) {
      set.status = 404
      return notFound('Athlete')
    }
    return result
  }, { params: t.Object({ id: t.String() }) })

  // PATCH /athletes/:id/education/:educationId — update education entry
  .patch('/:id/education/:educationId', async ({ params, body, set }) => {
    const data = await service.updateEducation(params.educationId, params.id, body)
    if (!data) { set.status = 404; return notFound('Education entry') }
    return { data }
  }, {
    params: t.Object({ id: t.String(), educationId: t.String() }),
    body: t.Object({
      institution_name: t.String({ minLength: 1 }),
      degree: t.Optional(t.String()),
      field_of_study: t.Optional(t.String()),
      start_year: t.Optional(t.Number()),
      end_year: t.Optional(t.Union([t.Number(), t.Null()])),
      is_current: t.Optional(t.Union([t.Literal(0), t.Literal(1)])),
    }),
  })

  .get('/:id/profile-status', async ({ params, set }) => {
    const data = await service.getProfilePercent(params.id)
    if (!data) { set.status = 404; return notFound('Athlete') }
    return { completeness: data.profilePercent, hasEducation: data.hasEducation, hasSkills: data.hasSkills, hasPassport: data.hasPassport }
  }, { params: t.Object({ id: t.String() }) })    
