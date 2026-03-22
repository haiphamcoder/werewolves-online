import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { setupSocketHandlers } from './socketHandlers.js'
import { getRoomCount } from './roomManager.js'

/** Comma-separated list, e.g. `https://app.vercel.app,http://localhost:5173` */
function getAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN
  if (!raw) return ['http://localhost:5173']
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

const allowedOrigins = getAllowedOrigins()
const allowedOriginSet = new Set(allowedOrigins)

/** Vercel preview deploys use `*.vercel.app` origins not listed in CLIENT_ORIGIN */
function isVercelPreviewOrigin(origin: string): boolean {
  if (process.env.ALLOW_VERCEL_PREVIEWS !== 'true') return false
  return /^https:\/\/[a-zA-Z0-9.-]+\.vercel\.app$/.test(origin)
}

function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!origin) {
    callback(null, true)
    return
  }
  const normalized = origin.replace(/\/$/, '')
  if (allowedOriginSet.has(normalized) || isVercelPreviewOrigin(normalized)) {
    callback(null, true)
    return
  }
  callback(null, false)
}

const app = express()
const httpServer = createServer(app)

app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
)

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
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
  console.log(`   CORS allowed origins: ${allowedOrigins.join(', ')}`)
})
