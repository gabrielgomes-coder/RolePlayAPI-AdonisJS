import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from './../../database/factories/index'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
test.group('Sessions', async (group) => {
  test('should authenticate a user', async (assert) => {
    const plainPassword = 'test'
    const { id, email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.user, 'User is defined')
    assert.equal(body.user.id, id)
  })

  test('should return an api token when session is created', async (assert) => {
    const plainPassword = 'test'
    const { id, email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.token, 'Token is defined')
    assert.equal(body.user.id, id)
  })

  test('should return 400 when credentials are not provided', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/sessions').send({}).expect(400)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 400)
  })

  test('should return 400 when credentials invalid', async (assert) => {
    const { email } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({
        email,
        password: 'invalid',
      })
      .expect(400)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 400)
    assert.equal(body.message, 'invalid credentials')
  })

  test('should return 200 when user sign out', async (assert) => {
    const plainPassword = 'test'
    const { email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    const apiToken = body.token
    await supertest(BASE_URL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${apiToken.token}`)
      .expect(200)
  })

  test('should revoke token when user sign out', async (assert) => {
    const plainPassword = 'test'
    const { email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    const apiToken = body.token

    await supertest(BASE_URL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${apiToken.token}`)
      .expect(200)

    const revokedToken = await Database.query().select('*').from('api_tokens')
    assert.isEmpty(revokedToken)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
