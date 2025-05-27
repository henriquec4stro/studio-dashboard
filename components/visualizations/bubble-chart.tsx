"use client"

import { useEffect, useRef } from "react"

interface BubbleChartProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
}

export function BubbleChart({ data, width, height, enableSentiment }: BubbleChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ""

    // Calculate bubble sizes
    const maxCount = Math.max(...data.map((d) => d.count))
    const minRadius = 15
    const maxRadius = Math.min(width, height) / 8

    // Simple force simulation for bubble positioning
    const bubbles = data.slice(0, 30).map((item, index) => {
      const radius = minRadius + (item.count / maxCount) * (maxRadius - minRadius)

      // Spiral positioning
      const angle = index * 0.5
      const spiralRadius = Math.min(width, height) / 4 + index * 3
      const x = width / 2 + Math.cos(angle) * spiralRadius
      const y = height / 2 + Math.sin(angle) * spiralRadius

      return {
        ...item,
        x: Math.max(radius, Math.min(width - radius, x)),
        y: Math.max(radius, Math.min(height - radius, y)),
        radius,
      }
    })

    // Collision detection and adjustment
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubble1 = bubbles[i]
        const bubble2 = bubbles[j]
        const dx = bubble2.x - bubble1.x
        const dy = bubble2.y - bubble1.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = bubble1.radius + bubble2.radius + 5

        if (distance < minDistance) {
          const angle = Math.atan2(dy, dx)
          const targetDistance = minDistance
          const factor = (targetDistance - distance) / distance

          const moveX = dx * factor * 0.5
          const moveY = dy * factor * 0.5

          bubble1.x -= moveX
          bubble1.y -= moveY
          bubble2.x += moveX
          bubble2.y += moveY

          // Keep within bounds
          bubble1.x = Math.max(bubble1.radius, Math.min(width - bubble1.radius, bubble1.x))
          bubble1.y = Math.max(bubble1.radius, Math.min(height - bubble1.radius, bubble1.y))
          bubble2.x = Math.max(bubble2.radius, Math.min(width - bubble2.radius, bubble2.x))
          bubble2.y = Math.max(bubble2.radius, Math.min(height - bubble2.radius, bubble2.y))
        }
      }
    }

    // Draw bubbles
    bubbles.forEach((bubble) => {
      // Create group for bubble
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"

      // Draw circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", bubble.x.toString())
      circle.setAttribute("cy", bubble.y.toString())
      circle.setAttribute("r", bubble.radius.toString())

      let fillColor = "#3b82f6"
      if (enableSentiment && bubble.sentiment) {
        switch (bubble.sentiment.category) {
          case "positive":
            fillColor = "#22c55e"
            break
          case "negative":
            fillColor = "#ef4444"
            break
          default:
            fillColor = "#6b7280"
        }
      }

      circle.setAttribute("fill", fillColor)
      circle.setAttribute("opacity", "0.7")
      circle.setAttribute("stroke", "#ffffff")
      circle.setAttribute("stroke-width", "2")

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        circle.setAttribute("opacity", "0.9")
        circle.setAttribute("stroke-width", "3")
      })
      group.addEventListener("mouseleave", () => {
        circle.setAttribute("opacity", "0.7")
        circle.setAttribute("stroke-width", "2")
      })

      group.appendChild(circle)

      // Add text (word)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", bubble.x.toString())
      text.setAttribute("y", bubble.y.toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("dominant-baseline", "middle")
      text.setAttribute("font-size", Math.max(10, bubble.radius / 3).toString())
      text.setAttribute("font-weight", "600")
      text.setAttribute("fill", "#ffffff")
      text.setAttribute("pointer-events", "none")
      text.textContent = bubble.word
      group.appendChild(text)

      // Add count as smaller text
      const countText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      countText.setAttribute("x", bubble.x.toString())
      countText.setAttribute("y", (bubble.y + bubble.radius / 3).toString())
      countText.setAttribute("text-anchor", "middle")
      countText.setAttribute("dominant-baseline", "middle")
      countText.setAttribute("font-size", Math.max(8, bubble.radius / 5).toString())
      countText.setAttribute("fill", "#ffffff")
      countText.setAttribute("opacity", "0.8")
      countText.setAttribute("pointer-events", "none")
      countText.textContent = `(${bubble.count})`
      group.appendChild(countText)

      svg.appendChild(group)
    })
  }, [data, width, height, enableSentiment])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="border rounded-lg bg-gradient-to-br from-slate-50 to-white"
    />
  )
}
