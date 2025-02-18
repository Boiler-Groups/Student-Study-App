import express from 'express';
import 'dotenv/config';
import mongoConnect from './config/db.js';
import userRoutes from './routes/userRoutes.js';

const app = express()

app.use(express.json());
app.use('/api/users', userRoutes);

const port = process.env.PORT || 8080

mongoConnect().then(async () => {
    app.listen(port, () => {
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
        console.log(`Server listening on port: ${port}`)
    })
})

export default app;