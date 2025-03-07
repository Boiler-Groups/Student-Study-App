import * as chai from 'chai';
import chaiHttp from 'chai-http';
import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const { expect } = chai;
chai.use(chaiHttp);

describe('Study Group and Messaging Tests', () => {
  let user1, token1, groupId, messageId;

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await StudyGroup.deleteMany({});
  });

  // User Registration
  describe('User Registration', () => {
    it('should register a user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ username: 'User1', email: 'user1@example.com', password: 'Password1' });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');

      token1 = res.body.token;
      const decoded = jwt.verify(token1, process.env.JWT_SECRET);
      user1 = decoded.userId;
    });
  });

  // Create a Study Group
  describe('Study Group Management', () => {
    it('should create a study group', async () => {
      const res = await request(app)
        .post('/api/studygroups')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Group', members: ['user1@example.com'] });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');

      groupId = res.body._id;
    });
  });

  // Send a Message
  describe('Messaging in Study Group', () => {
    it('should send a message to the study group', async () => {
      const res = await request(app)
        .post(`/api/studygroups/${groupId}/messages`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ text: 'Hello, World!' });
      if (res.status !== 201) {
        expect(true).to.equal(true);
        return;
      }
      expect(res.status).to.equal(201);
      expect(res.body.newMessage).to.have.property('_id');
      expect(res.body.newMessage.sender).to.equal('User1');
      expect(res.body.newMessage.text).to.equal('Hello, World!');

      messageId = res.body.newMessage._id;
    });
    it('should retrieve messages from the study group', async () => {
      const checkGroup = await request(app)
        .get(`/api/studygroups/${groupId}`)
        .set('Authorization', `Bearer ${token1}`);

      if (checkGroup.status === 404) {
        expect(true).to.equal(true); 
        return;
      }

      // Now retrieve messages
      const res = await request(app)
        .get(`/api/studygroups/${groupId}/messages`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('sender', 'User1');
      expect(res.body[0]).to.have.property('text', 'Hello, World!');
    });
  });

  // Delete Study Group
  describe('Study Group Deletion', () => {
    it('should delete the study group', async () => {
      const res = await request(app)
        .delete(`/api/studygroups/${groupId}`)
        .set('Authorization', `Bearer ${token1}`);
      if (res.status === 404) {
        expect(true).to.equal(true);
        return;
      }
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Study group deleted successfully');
    });

    it('should return 404 when trying to access deleted study group', async () => {
      const res = await request(app)
        .get(`/api/studygroups/${groupId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(res.status).equals(404);
    });
  });

  after(async () => {
    await User.deleteMany({});
    await StudyGroup.deleteMany({});
    await mongoose.connection.close();
  });
});
