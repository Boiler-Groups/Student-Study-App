import * as chai from 'chai';
import chaiHttp from 'chai-http';
import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import 'dotenv/config';

const { expect } = chai;

chai.use(chaiHttp);

describe('User Registration and Login', () => {

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/users/register', () => {

    // Test user registration
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'TestUser',
          email: 'testuser@example.com',
          password: 'Password'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
    });

    // Test duplicate user registration
    it('should not register a user with an already registered email', async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          username: 'TestUser',
          email: 'duplicate@example.com',
          password: 'Password'
        });

      // Attempt to register a user with the same email
      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'AnotherUser',
          email: 'duplicate@example.com',
          password: 'Password'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Email already exists');
    });
  });

  describe('POST /api/users/login', () => {

    // Directly create a user before each test
    beforeEach(async () => {
      const salt = await import('bcryptjs').then(bcrypt => bcrypt.genSalt(10));
      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash('Password123', salt));
      await User.create({
        username: 'TestUser',
        email: 'testlogin@example.com',
        password: hashedPassword
      });
    });

    // Attempt to log in with valid credentials
    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'testlogin@example.com',
          password: 'Password123'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    // Attempt to log in with invalid credentials
    it('should not log in with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'testlogin@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });

  after(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.connection.close();
  });
});