import express from 'express';
import 'dotenv/config';
import mongoConnect from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import studyGroupRoutes from './routes/studyGroupRoutes.js';
import noteRouter from './routes/noteRouter.js';
import classRoutes from './routes/classRoutes.js';
import summarizeRoutes from "./routes/summarizeRoutes.js";
import conceptsRoute from './routes/conceptRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

const allowedOrigins = ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

//Added to support sending images
app.use(express.json({ limit: "10mb" }));
//app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/users', userRoutes);
app.use('/api/studygroups', studyGroupRoutes);
app.use('/api/notes', noteRouter);
app.use('/api/classes', classRoutes);
app.use("/api/summarize", summarizeRoutes);
app.use("/api/concepts", conceptsRoute);
const port = process.env.PORT || 8080

mongoConnect().then(async () => {
    app.listen(port, () => {
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
        console.log(`Server listening on port: ${port}`)
    })
})

export default app;