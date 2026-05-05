import type { Obstacle, Coin, Particle } from './types'
import { PLAYER_SIZE } from './types'

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 12
) {
  ctx.font = `bold ${size}px 'Courier New', monospace`
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(text, x, y)
}

export function drawCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cw: number
) {
  ctx.fillStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.arc(cx, cy, cw * 0.22, 0, Math.PI * 2)
  ctx.arc(cx + cw * 0.28, cy - cw * 0.08, cw * 0.18, 0, Math.PI * 2)
  ctx.arc(cx + cw * 0.52, cy, cw * 0.2, 0, Math.PI * 2)
  ctx.arc(cx + cw * 0.24, cy + cw * 0.06, cw * 0.16, 0, Math.PI * 2)
  ctx.fill()
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  bgOffset: number
) {
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(w, groundY)
  ctx.stroke()

  // dashed moving road marks
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  const dashW = 16
  const gap = 24
  const total = dashW + gap
  const offset = -(bgOffset % total)
  for (let dx = offset; dx < w; dx += total) {
    if (dx + dashW < 0) continue
    ctx.beginPath()
    ctx.moveTo(dx, groundY + 10)
    ctx.lineTo(Math.min(dx + dashW, w), groundY + 10)
    ctx.stroke()
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  legFrame: number,
  onGround: boolean
) {
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
  const legSwing = onGround ? Math.sin(legFrame) * 6 : 0
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

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  groundY: number
) {
  const x = o.x
  const y = groundY - o.height - o.yOffset
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

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  c: Coin,
  frame: number
) {
  if (c.collected) return
  const floatY = Math.sin(frame * 0.08 + c.floatOffset) * 4
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

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
  }
}

export function drawTitleScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
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
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  score: number,
  highScore: number
) {
  ctx.fillStyle = 'rgba(248, 250, 252, 0.92)'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#0f172a'
  ctx.font = "bold 16px 'Courier New', monospace"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('A MUDANÇA VENCEU!', w / 2, h * 0.35)
  ctx.font = "13px 'Courier New', monospace"
  ctx.fillText(`Pontuação: ${Math.floor(score)}`, w / 2, h * 0.48)
  if (Math.floor(score) >= highScore && score > 0) {
    ctx.fillStyle = '#dc2626'
    ctx.fillText('NOVO RECORDE!', w / 2, h * 0.58)
    ctx.fillStyle = '#0f172a'
  }
  ctx.font = "11px 'Courier New', monospace"
  ctx.fillStyle = '#64748b'
  ctx.fillText('Espaço / Toque para recomeçar', w / 2, h * 0.72)
  ctx.textAlign = 'start'
}
