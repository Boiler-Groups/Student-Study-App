import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testApp = express();

testApp.use(express.json());
testApp.use('/api/users', userRoutes);

export default testApp;

