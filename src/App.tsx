import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GameProvider } from './hooks/GameContext'
import { useBackendKeepAlive } from './hooks/useBackendKeepAlive'
import { HomePage } from './pages/HomePage'
import { RoomPage } from './pages/RoomPage'

export function App() {
  useBackendKeepAlive()
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  )
}

export default App
