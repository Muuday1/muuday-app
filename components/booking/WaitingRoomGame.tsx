'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// A minimal black-and-white endless runner for the video-call waiting room.
// No external images — everything is drawn on canvas with paths.
// High score lives only in sessionStorage (per-session).

type ObstacleType = 'plane' | 'house' | 'suitcase' | 'building'

interface Obstacle {
  x: number
  type: ObstacleType
  width: number
  height: number
  yOffset: number // from ground up
  passed: boolean
}

interface Coin {
  x: number
  y: number
  collected: boolean
  floatOffset: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

const GROUND_Y_RATIO = 0.82
const PLAYER_SIZE = 32
const GRAVITY = 0.55
const JUMP_STRENGTH = -9.8
const BASE_SPEED = 4.2
const MAX_SPEED = 11
const SPEED_INCREMENT = 0.001
const COIN_SPAWN_CHANCE = 0.72

function getHighScore(): number {
  if (typeof window === 'undefined') return 0
  const raw = sessionStorage.getItem('waiting-room-high-score')
  return raw ? parseInt(raw, 10) || 0 : 0
}

function setHighScore(score: number) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('waiting-room-high-score', String(score))
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function WaitingRoomGame({ isPaused = false }: { isPaused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [highScore, setHighScoreState] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)

  // Mutable game state (ref-based for the render loop)
  const stateRef = useRef({
    running: false,
    started: false,
    over: false,
    score: 0,
    speed: BASE_SPEED,
    groundY: 0,
    frame: 0,
    lastObstacleX: 0,
    player: {
      x: 60,
      y: 0,
      vy: 0,
      onGround: true,
      legFrame: 0,
    },
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    particles: [] as Particle[],
    bgOffset: 0,
    clouds: [] as { x: number; y: number; w: number; speed: number }[],
  })

  // Init high score
  useEffect(() => {
    setHighScoreState(getHighScore())
  }, [])

  // Expose score to React state periodically
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current
      if (s.started && !s.over) {
        setCurrentScore(Math.floor(s.score))
      }
    }, 250)
    return () => clearInterval(id)
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    s.started = true
    s.running = true
    s.over = false
    s.score = 0
    s.speed = BASE_SPEED
    s.obstacles = []
    s.coins = []
    s.particles = []
    s.lastObstacleX = 0
    s.player.vy = 0
    s.player.onGround = true
    s.player.legFrame = 0
    setGameStarted(true)
    setGameOver(false)
    setCurrentScore(0)
  }, [])

  const resetGame = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    s.groundY = canvas.height * GROUND_Y_RATIO
    s.player.y = s.groundY - PLAYER_SIZE
    startGame()
  }, [startGame])

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current) return
    const cvs = canvasRef.current
    const rawCtx = cvs.getContext('2d')
    if (!rawCtx) return
    const ctx = rawCtx

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    function resize() {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const w = Math.max(rect.width, 280)
      const h = Math.max(rect.height, 220)
      cvs.width = w * dpr
      cvs.height = h * dpr
      cvs.style.width = `${w}px`
      cvs.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stateRef.current.groundY = h * GROUND_Y_RATIO
      if (!stateRef.current.started) {
        stateRef.current.player.y = stateRef.current.groundY - PLAYER_SIZE
      }
      // init clouds once
      if (stateRef.current.clouds.length === 0) {
        for (let i = 0; i < 4; i++) {
          stateRef.current.clouds.push({
            x: Math.random() * w,
            y: 20 + Math.random() * (h * 0.25),
            w: 40 + Math.random() * 60,
            speed: 0.15 + Math.random() * 0.25,
          })
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const s = stateRef.current
    s.groundY = cvs.height / dpr * GROUND_Y_RATIO
    s.player.y = s.groundY - PLAYER_SIZE

    function spawnObstacle(w: number) {
      const score = s.score
      let type: ObstacleType = 'plane'
      if (score > 1500) type = 'building'
      else if (score > 800) type = 'suitcase'
      else if (score > 300) type = 'house'

      const configs: Record<ObstacleType, { w: number; h: number; yOff: number }> = {
        plane: { w: 44, h: 22, yOff: randomBetween(18, 48) }, // flies slightly above ground
        house: { w: 34, h: 40, yOff: 0 },
        suitcase: { w: 26, h: 22, yOff: 0 },
        building: { w: 32, h: 56, yOff: 0 },
      }

      const cfg = configs[type]
      s.obstacles.push({
        x: w + 10,
        type,
        width: cfg.w,
        height: cfg.h,
        yOffset: cfg.yOff,
        passed: false,
      })

      s.lastObstacleX = w + 10

      // Chance to spawn coins above/next to obstacle
      if (Math.random() < COIN_SPAWN_CHANCE) {
        const coinY =
          type === 'plane'
            ? s.groundY - cfg.yOff - cfg.h / 2 - 10 - Math.random() * 25
            : s.groundY - cfg.h - 16 - Math.random() * 35
        s.coins.push({
          x: w + 10 + cfg.w / 2 + randomBetween(-10, 30),
          y: coinY,
          collected: false,
          floatOffset: Math.random() * Math.PI * 2,
        })
      }
    }

    function addParticles(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          x,
          y,
          vx: randomBetween(-2.5, 2.5),
          vy: randomBetween(-3, -0.5),
          life: 1,
          maxLife: randomBetween(20, 40),
        })
      }
    }

    function rectIntersect(
      ax: number,
      ay: number,
      aw: number,
      ah: number,
      bx: number,
      by: number,
      bw: number,
      bh: number
    ) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    // Drawing helpers
    function drawPixelText(text: string, x: number, y: number, size = 12) {
      ctx.font = `bold ${size}px 'Courier New', monospace`
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#0f172a'
      ctx.fillText(text, x, y)
    }

    function drawCloud(cx: number, cy: number, cw: number) {
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(cx, cy, cw * 0.22, 0, Math.PI * 2)
      ctx.arc(cx + cw * 0.28, cy - cw * 0.08, cw * 0.18, 0, Math.PI * 2)
      ctx.arc(cx + cw * 0.52, cy, cw * 0.2, 0, Math.PI * 2)
      ctx.arc(cx + cw * 0.24, cy + cw * 0.06, cw * 0.16, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawGround(w: number, h: number) {
      const gy = s.groundY
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(w, gy)
      ctx.stroke()

      // dashed moving road marks
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      const dashW = 16
      const gap = 24
      const total = dashW + gap
      const offset = -(s.bgOffset % total)
      for (let dx = offset; dx < w; dx += total) {
        if (dx + dashW < 0) continue
        ctx.beginPath()
        ctx.moveTo(dx, gy + 10)
        ctx.lineTo(Math.min(dx + dashW, w), gy + 10)
        ctx.stroke()
      }
    }

    function drawPlayer(px: number, py: number) {
      const size = PLAYER_SIZE
      // body
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      // rounded rect body
      const r = 4
      const bx = px + 6
      const by = py + 8
      const bw = size - 12
      const bh = size - 16
      ctx.moveTo(bx + r, by)
      ctx.lineTo(bx + bw - r, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
      ctx.lineTo(bx + bw, by + bh - r)
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
      ctx.lineTo(bx + r, by + bh)
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
      ctx.lineTo(bx, by + r)
      ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.fill()

      // head
      ctx.beginPath()
      ctx.arc(px + size / 2, py + 7, 6, 0, Math.PI * 2)
      ctx.fill()

      // legs (animate when running)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2.5
      const legSwing = s.player.onGround ? Math.sin(s.player.legFrame) * 6 : 0
      ctx.beginPath()
      ctx.moveTo(px + size / 2 - 3, py + size - 8)
      ctx.lineTo(px + size / 2 - 3 + legSwing, py + size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px + size / 2 + 3, py + size - 8)
      ctx.lineTo(px + size / 2 + 3 - legSwing, py + size)
      ctx.stroke()

      // tiny backpack hint
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.roundRect(px + size - 10, py + 10, 6, 10, 2)
      ctx.fill()
    }

    function drawObstacle(o: Obstacle) {
      const x = o.x
      const y = s.groundY - o.height - o.yOffset
      ctx.fillStyle = '#0f172a'
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2

      switch (o.type) {
        case 'plane': {
          // simple plane silhouette
          ctx.beginPath()
          ctx.ellipse(x + o.width / 2, y + o.height / 2, o.width / 2, o.height / 2.8, 0, 0, Math.PI * 2)
          ctx.fill()
          // wing
          ctx.beginPath()
          ctx.moveTo(x + 6, y + o.height / 2)
          ctx.lineTo(x + o.width / 2, y - 4)
          ctx.lineTo(x + o.width - 6, y + o.height / 2)
          ctx.fill()
          // tail
          ctx.beginPath()
          ctx.moveTo(x + 4, y + o.height / 2 - 2)
          ctx.lineTo(x - 2, y + 2)
          ctx.lineTo(x + 6, y + o.height / 2 + 2)
          ctx.fill()
          break
        }
        case 'house': {
          // body
          ctx.fillRect(x + 4, y + o.height * 0.35, o.width - 8, o.height * 0.65)
          // roof triangle
          ctx.beginPath()
          ctx.moveTo(x, y + o.height * 0.4)
          ctx.lineTo(x + o.width / 2, y)
          ctx.lineTo(x + o.width, y + o.height * 0.4)
          ctx.closePath()
          ctx.fill()
          // door
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x + o.width / 2 - 4, y + o.height * 0.6, 8, o.height * 0.4)
          break
        }
        case 'suitcase': {
          // handle
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x + 6, y)
          ctx.lineTo(x + 6, y + 5)
          ctx.moveTo(x + o.width - 6, y)
          ctx.lineTo(x + o.width - 6, y + 5)
          ctx.moveTo(x + 6, y)
          ctx.lineTo(x + o.width - 6, y)
          ctx.stroke()
          // body
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(x, y + 5, o.width, o.height - 5)
          // stripe
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x + 4, y + 8, o.width - 8, 2)
          break
        }
        case 'building': {
          // tall building
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(x + 2, y, o.width - 4, o.height)
          // windows
          ctx.fillStyle = '#ffffff'
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
              ctx.fillRect(x + 6 + col * 10, y + 8 + row * 14, 6, 8)
            }
          }
          // antenna
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x + o.width / 2, y)
          ctx.lineTo(x + o.width / 2, y - 10)
          ctx.stroke()
          break
        }
      }
    }

    function drawCoin(c: Coin) {
      if (c.collected) return
      const floatY = Math.sin(s.frame * 0.08 + c.floatOffset) * 4
      const cx = c.x
      const cy = c.y + floatY
      const r = 7
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      // inner white ring
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, r - 2.5, 0, Math.PI * 2)
      ctx.stroke()
      // $ symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', cx, cy)
      ctx.textAlign = 'start'
    }

    function drawParticles() {
      for (const p of s.particles) {
        const alpha = p.life / p.maxLife
        ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
      }
    }

    let animId = 0

    function loop() {
      const w = cvs.width / dpr
      const h = cvs.height / dpr
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, w, h)

      // Clouds
      for (const cloud of s.clouds) {
        drawCloud(cloud.x, cloud.y, cloud.w)
        if (s.running && !s.over) {
          cloud.x -= cloud.speed
          if (cloud.x + cloud.w < -20) {
            cloud.x = w + 20 + Math.random() * 80
            cloud.y = 20 + Math.random() * (h * 0.25)
          }
        }
      }

      drawGround(w, h)

      if (!s.started) {
        // Title screen
        ctx.fillStyle = '#0f172a'
        ctx.font = "bold 18px 'Courier New', monospace"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('O EXPAT', w / 2, h * 0.32)
        ctx.font = "12px 'Courier New', monospace"
        ctx.fillText('Pule os obstáculos da mudança!', w / 2, h * 0.46)
        ctx.font = "11px 'Courier New', monospace"
        ctx.fillStyle = '#64748b'
        ctx.fillText('Espaço / Toque para começar', w / 2, h * 0.58)
        ctx.textAlign = 'start'

        drawPlayer(s.player.x, s.player.y)
        animId = requestAnimationFrame(loop)
        return
      }

      if (s.running && !s.over && !isPaused) {
        s.frame++
        s.score += s.speed * 0.015
        s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.score * SPEED_INCREMENT)
        s.bgOffset += s.speed
        s.player.legFrame += 0.25

        // Gravity
        s.player.vy += GRAVITY
        s.player.y += s.player.vy

        if (s.player.y >= s.groundY - PLAYER_SIZE) {
          s.player.y = s.groundY - PLAYER_SIZE
          s.player.vy = 0
          s.player.onGround = true
        } else {
          s.player.onGround = false
        }

        // Spawn obstacles proportional to canvas width
        const distSinceLast = w - (s.lastObstacleX < 0 ? w : s.lastObstacleX)
        const spawnDistMin = w * 1.2
        const spawnDistMax = w * 2.2
        const spawnDist = randomBetween(spawnDistMin, spawnDistMax) * (BASE_SPEED / s.speed)
        if (s.lastObstacleX === 0 || distSinceLast >= spawnDist) {
          spawnObstacle(w)
        }

        // Move obstacles
        for (const o of s.obstacles) {
          o.x -= s.speed
        }
        for (const c of s.coins) {
          c.x -= s.speed
        }

        // Cleanup off-screen
        s.obstacles = s.obstacles.filter(o => o.x + o.width > -40)
        s.coins = s.coins.filter(c => c.x > -30)

        // Collision: obstacles
        const px = s.player.x + 4
        const py = s.player.y + 2
        const pw = PLAYER_SIZE - 8
        const ph = PLAYER_SIZE - 4

        for (const o of s.obstacles) {
          const ox = o.x + 2
          const oy = s.groundY - o.height - o.yOffset + 2
          const ow = o.width - 4
          const oh = o.height - 4
          if (rectIntersect(px, py, pw, ph, ox, oy, ow, oh)) {
            s.over = true
            s.running = false
            addParticles(s.player.x + PLAYER_SIZE / 2, s.player.y + PLAYER_SIZE / 2, 18)
            const finalScore = Math.floor(s.score)
            setGameOver(true)
            setCurrentScore(finalScore)
            const hs = getHighScore()
            if (finalScore > hs) {
              setHighScore(finalScore)
              setHighScoreState(finalScore)
            }
          }
        }

        // Collision: coins
        for (const c of s.coins) {
          if (c.collected) continue
          const floatY = Math.sin(s.frame * 0.08 + c.floatOffset) * 4
          const cx = c.x
          const cy = c.y + floatY
          if (rectIntersect(px, py, pw, ph, cx - 6, cy - 6, 12, 12)) {
            c.collected = true
            s.score += 15
            addParticles(cx, cy, 8)
          }
        }
      }

      // Draw coins
      for (const c of s.coins) {
        drawCoin(c)
      }

      // Draw obstacles
      for (const o of s.obstacles) {
        drawObstacle(o)
      }

      // Draw player
      drawPlayer(s.player.x, s.player.y)

      // Particles
      for (const p of s.particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life -= 1
      }
      s.particles = s.particles.filter(p => p.life > 0)
      drawParticles()

      // HUD
      drawPixelText(`PTS ${Math.floor(s.score)}`, 12, 12, 13)
      if (highScore > 0) {
        drawPixelText(`REC ${highScore}`, 12, 30, 11)
      }

      // Game Over overlay
      if (s.over) {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.92)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#0f172a'
        ctx.font = "bold 16px 'Courier New', monospace"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('A MUDANÇA VENCEU!', w / 2, h * 0.35)
        ctx.font = "13px 'Courier New', monospace"
        ctx.fillText(`Pontuação: ${Math.floor(s.score)}`, w / 2, h * 0.48)
        if (Math.floor(s.score) >= highScore && s.score > 0) {
          ctx.fillStyle = '#dc2626'
          ctx.fillText('NOVO RECORDE!', w / 2, h * 0.58)
          ctx.fillStyle = '#0f172a'
        }
        ctx.font = "11px 'Courier New', monospace"
        ctx.fillStyle = '#64748b'
        ctx.fillText('Espaço / Toque para recomeçar', w / 2, h * 0.72)
        ctx.textAlign = 'start'
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [highScore, isPaused])

  // Input handling
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        const s = stateRef.current
        if (!s.started || s.over) {
          if (s.over) {
            resetGame()
          } else {
            startGame()
          }
          return
        }
        if (s.player.onGround) {
          s.player.vy = JUMP_STRENGTH
          s.player.onGround = false
          // Dust particles on jump
          for (let i = 0; i < 6; i++) {
            s.particles.push({
              x: s.player.x + PLAYER_SIZE / 2 + randomBetween(-8, 8),
              y: s.groundY,
              vx: randomBetween(-1.5, 1.5),
              vy: randomBetween(-1, -0.3),
              life: 1,
              maxLife: randomBetween(10, 20),
            })
          }
        }
      }
    }

    function onTouchStart(e: TouchEvent) {
      // Allow tap on canvas only
      const target = e.target as HTMLElement
      if (!canvasRef.current || !canvasRef.current.contains(target)) return
      e.preventDefault()
      const s = stateRef.current
      if (!s.started || s.over) {
        if (s.over) {
          resetGame()
        } else {
          startGame()
        }
        return
      }
      if (s.player.onGround) {
        s.player.vy = JUMP_STRENGTH
        s.player.onGround = false
        // Dust particles on jump
        for (let i = 0; i < 6; i++) {
          s.particles.push({
            x: s.player.x + PLAYER_SIZE / 2 + randomBetween(-8, 8),
            y: s.groundY,
            vx: randomBetween(-1.5, 1.5),
            vy: randomBetween(-1, -0.3),
            life: 1,
            maxLife: randomBetween(10, 20),
          })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [startGame, resetGame])

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
