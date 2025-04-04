const request = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const expect = chai.expect;

let app;
let User;
let bcrypt;

process.env.JWT_SECRET = 'testsecret';

describe('Login streak point logic', () => {
  let userStub, bcryptStub, jwtStub;

  before(async () => {
    const appModule = await import('../testApp.js');
    const userModule = await import('../models/User.js');
    const bcryptModule = await import('bcryptjs'); // this is the fix
  
    app = appModule.default;
    User = userModule.default;
    bcrypt = bcryptModule.default; // match the controller's import
  });

  beforeEach(function () {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const fakeUser = {
      _id: 'abc123',
      email: 'test@example.com',
      password: 'hashedpassword',
      lastLogin: twoDaysAgo,
      streak: 0,
      points: 0,
      save: function () {
        console.log('[SAVE CALLED] points:', this.points, 'streak:', this.streak);
        return Promise.resolve();
      }
    };

    this.fakeUser = fakeUser;

    userStub = sinon.stub(User, 'findOne').resolves(fakeUser);
    bcryptStub = sinon.stub(bcrypt, 'compare').resolves(true);
    jwtStub = sinon.stub(jwt, 'sign').returns('test-token');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should increase user points when logging in on a new day', async function () {
    const response = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'password123' });

    console.log('[TEST RESPONSE]', response.body);

    expect(this.fakeUser.points).to.equal(100);
    expect(this.fakeUser.streak).to.equal(1);
  });
});
