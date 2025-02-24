import express from 'express';
import 'dotenv/config';
import mongoConnect from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import studyGroupRoutes from './routes/studyGroupRoutes.js';

const app = express()

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/studygroups', studyGroupRoutes);

const port = process.env.PORT || 8080

mongoConnect().then(async () => {
    app.listen(port, () => {
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
        console.log(`Server listening on port: ${port}`)
    })
})

export default app;