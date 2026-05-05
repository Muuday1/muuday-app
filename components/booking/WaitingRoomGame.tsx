'use client'

import { useWaitingRoomGame } from './waiting-room-game/use-waiting-room-game'

export default function WaitingRoomGame({ isPaused = false }: { isPaused?: boolean }) {
  const {
    canvasRef,
    containerRef,
    gameStarted,
    gameOver,
    currentScore,
  } = useWaitingRoomGame(isPaused)

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50"
      style={{ height: 'clamp(220px, 40vh, 340px)', touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-pointer"
        aria-label="Jogo da sala de espera"
      />
      {/* Subtle instruction when game is idle or running */}
      <div className="pointer-events-none absolute right-2 top-2 text-[10px] font-medium text-slate-400">
        {gameStarted && !gameOver ? `${currentScore} pts` : ''}
      </div>
    </div>
  )
}
