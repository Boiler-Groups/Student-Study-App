import 'dotenv/config'
import express from 'express'
import mongoConnect from './config/db.js'

const app = express()
const port = process.env.PORT || 8080

mongoConnect().then(async () => {
    app.listen(port, () => {
        console.log(`node env: ${process.env.NODE_ENV}`)
        console.log(`server listening on port ${port}`)
    })
})