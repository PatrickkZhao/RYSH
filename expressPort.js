// const express = require('express')
import express from 'express'
export const app = express()
const port = 3000
app.use(express.json())
app.listen(port, () => {
    console.log(`BOT is listening ${port}`)
})
app.get('/', (req, res) => {
    res.send('Hello World!')
})