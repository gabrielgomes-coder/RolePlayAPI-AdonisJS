import Factory from '@ioc:Adonis/Lucid/Factory'
import User from 'App/Models/User'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    username: faker.internet.userName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    avatar: faker.image.imageUrl(),
  }
}).build()
