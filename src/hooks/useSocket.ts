import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/shared/types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** Prefer explicit socket URL; otherwise reuse API base (same host:port as Express + Socket.IO). */
function getSocketUrl(): string | undefined {
  const direct = import.meta.env.VITE_SOCKET_URL
  if (typeof direct === 'string' && direct.length > 0) return direct
  const api = import.meta.env.VITE_API_URL
  if (typeof api === 'string' && api.length > 0) return api
  return undefined
}

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket: TypedSocket = io(getSocketUrl(), {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      const s = socketRef.current
      if (!s) {
        return
      }
      // Must call emit with socket as `this` — detached `s.emit(...)` loses binding and throws (_opts).
      const emitBound = s.emit.bind(s) as (ev: string, ...a: unknown[]) => void
      emitBound(event as string, ...args)
    },
    [],
  )

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E],
    ) => {
      const s = socketRef.current
      if (!s) return () => {}
      s.on(event, handler as never)
      return () => {
        s.off(event, handler as never)
      }
    },
    [],
  )

  return { socket: socketRef, isConnected, emit, on }
}
