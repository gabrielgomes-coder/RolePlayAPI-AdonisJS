import { UserFactory } from './../../database/factories/index'
import test from 'japa'
import supertest from 'supertest'
import Database from '@ioc:Adonis/Lucid/Database'
import Hash from '@ioc:Adonis/Core/Hash'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
test.group('User', (group) => {
  test('should create a user', async (assert) => {
    const userPayload = {
      email: 'test@example.com',
      username: 'test',
      password: 'test',
      avatar: 'http://images.com/image/1',
    }
    const { body } = await supertest(BASE_URL).post('/users').send(userPayload).expect(201)
    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.id, 'id undefined')
    assert.equal(body.user.email, userPayload.email)
    assert.equal(body.user.username, userPayload.username)
    assert.notExists(body.user.password, 'Password defined')
  })

  test('should return 409 when email is already in use', async (assert) => {
    const { email } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email, username: 'test', password: 'test' })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('should return 409 when username is already in use', async (assert) => {
    const { username } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'teste@teste.com', username, password: 'test' })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('should return 422 when data is not provided', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/users').send({}).expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('should return 422 when provided an invalid email', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'test@', password: '1234', username: 'test' })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('should return 422 when privided an invalid password', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'test@teste.com', password: '123', username: 'test' })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('should update a user', async (assert) => {
    const { id, password } = await UserFactory.create()
    const email = 'test@teste.com'
    const avatar = 'https://github.com/gabrielgomes-coder.png'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({
        email,
        avatar,
        password,
      })
      .expect(200)

    assert.exists(body.user, 'user undefined')
    assert.equal(body.user.email, email)
    assert.equal(body.user.avatar, avatar)
    assert.equal(body.user.id, id)
  })

  test('should update the password of the user', async (assert) => {
    const user = await UserFactory.create()
    const password = 'test'
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({
        email: user.email,
        avatar: user.avatar,
        password,
      })
      .expect(200)

    assert.exists(body.user, 'user undefined')
    assert.equal(body.user.id, user.id)

    await user.refresh()
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('Should return 422 when required data is not provided', async (assert) => {
    const { id } = await UserFactory.create()
    const { body } = await supertest(BASE_URL).put(`/users/${id}`).send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('Should return 422 when providing an invalid email address', async (assert) => {
    const { id, password, avatar } = await UserFactory.create()
    const email = 'test@'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({
        email,
        password,
        avatar,
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('Should return 422 when providing an invalid password', async (assert) => {
    const { id, email, avatar } = await UserFactory.create()
    const password = '12'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({
        email,
        password,
        avatar,
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('Should return 422 when providing an invalid avatar', async (assert) => {
    const { id, email, password } = await UserFactory.create()
    const avatar = 'test'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({
        email,
        password,
        avatar,
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})