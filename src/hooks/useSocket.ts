import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/shared/types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const socketUrl =
  typeof import.meta.env.VITE_SOCKET_URL === 'string' &&
  import.meta.env.VITE_SOCKET_URL.length > 0
    ? import.meta.env.VITE_SOCKET_URL
    : undefined

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket: TypedSocket = io(socketUrl, {
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
      // socket.io typings use a narrow `emit`; widen for our typed event map
      const emitLoose = s.emit as (ev: string, ...a: unknown[]) => void
      emitLoose(event as string, ...args)
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
