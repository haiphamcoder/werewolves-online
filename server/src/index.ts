import 'dotenv/config'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { setupSocketHandlers } from './socketHandlers.js'
import { getRoomCount } from './roomManager.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',')
      : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: getRoomCount() })
})

setupSocketHandlers(io)

const PORT = Number(process.env.PORT) || 3001

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other server on this port or set PORT in .env to a different value.`,
    )
  } else {
    console.error(err)
  }
  process.exit(1)
})

httpServer.listen(PORT, () => {
  console.log(`🐺 Werewolves server running on port ${PORT}`)
})
