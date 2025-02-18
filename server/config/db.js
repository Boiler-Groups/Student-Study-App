import mongoose from 'mongoose'

const connectMongo = () =>
    new Promise((res, rej) => {
        const mongoURI = process.env.MONGO_URI

        if (!mongoURI) {
            console.log('missing DATABASE_URL env')
            return
        }

        mongoose.connect(mongoURI).catch((e) => {
            console.error(e)
            rej(e)
        })

        const db = mongoose.connection

        db.once('open', () => {
            console.log('connected to mongodb')
            res()
        })
    })

export default connectMongo