"use client"

import { useEffect, useRef } from "react"

interface WordSpiralProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
}

export function WordSpiral({ data, width, height, enableSentiment }: WordSpiralProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ""

    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) / 2 - 50

    data.slice(0, 30).forEach((item, index) => {
      const angle = index * 0.5 // Spiral angle increment
      const radius = (index / data.length) * maxRadius
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      // Create group for word
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"

      // Calculate font size based on count
      const fontSize = Math.max(10, Math.min(24, 8 + item.count * 1.5))

      // Draw background circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", x.toString())
      circle.setAttribute("cy", y.toString())
      circle.setAttribute("r", (fontSize / 2 + 5).toString())

      let fillColor = "#3b82f6"
      if (enableSentiment && item.sentiment) {
        switch (item.sentiment.category) {
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
      circle.setAttribute("opacity", "0.2")
      circle.setAttribute("stroke", fillColor)
      circle.setAttribute("stroke-width", "1")

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        circle.setAttribute("opacity", "0.4")
        circle.setAttribute("stroke-width", "2")
      })
      group.addEventListener("mouseleave", () => {
        circle.setAttribute("opacity", "0.2")
        circle.setAttribute("stroke-width", "1")
      })

      group.appendChild(circle)

      // Add text
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", x.toString())
      text.setAttribute("y", y.toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("dominant-baseline", "middle")
      text.setAttribute("font-size", fontSize.toString())
      text.setAttribute("font-weight", "600")
      text.setAttribute("fill", fillColor)
      text.setAttribute("pointer-events", "none")
      text.textContent = item.word
      group.appendChild(text)

      svg.appendChild(group)
    })

    // Draw spiral path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    let pathData = `M ${centerX} ${centerY}`

    for (let i = 0; i <= 100; i++) {
      const angle = i * 0.3
      const radius = (i / 100) * maxRadius
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      pathData += ` L ${x} ${y}`
    }

    path.setAttribute("d", pathData)
    path.setAttribute("stroke", "#e2e8f0")
    path.setAttribute("stroke-width", "2")
    path.setAttribute("fill", "none")
    path.setAttribute("opacity", "0.3")
    svg.insertBefore(path, svg.firstChild)
  }, [data, width, height, enableSentiment])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50"
    />
  )
}
