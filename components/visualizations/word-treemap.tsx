"use client"

import { useEffect, useRef } from "react"

interface WordTreemapProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
}

export function WordTreemap({ data, width, height, enableSentiment }: WordTreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ""

    // Simple treemap algorithm
    const totalCount = data.reduce((sum, item) => sum + item.count, 0)
    const rectangles: Array<{
      word: string
      count: number
      sentiment?: { category: string; score: number }
      x: number
      y: number
      width: number
      height: number
    }> = []

    let currentX = 0
    let currentY = 0
    let rowHeight = 0
    const padding = 2

    data.slice(0, 20).forEach((item) => {
      const area = (item.count / totalCount) * width * height
      const rectWidth = Math.sqrt(area * (width / height))
      const rectHeight = area / rectWidth

      // Check if we need to start a new row
      if (currentX + rectWidth > width) {
        currentX = 0
        currentY += rowHeight + padding
        rowHeight = 0
      }

      rectangles.push({
        ...item,
        x: currentX,
        y: currentY,
        width: Math.min(rectWidth, width - currentX),
        height: Math.max(30, rectHeight),
      })

      currentX += rectWidth + padding
      rowHeight = Math.max(rowHeight, rectHeight)
    })

    // Draw rectangles
    rectangles.forEach((rect) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"

      // Draw rectangle
      const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rectangle.setAttribute("x", rect.x.toString())
      rectangle.setAttribute("y", rect.y.toString())
      rectangle.setAttribute("width", rect.width.toString())
      rectangle.setAttribute("height", rect.height.toString())

      let fillColor = "#3b82f6"
      if (enableSentiment && rect.sentiment) {
        switch (rect.sentiment.category) {
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

      rectangle.setAttribute("fill", fillColor)
      rectangle.setAttribute("opacity", "0.7")
      rectangle.setAttribute("stroke", "#ffffff")
      rectangle.setAttribute("stroke-width", "2")
      rectangle.setAttribute("rx", "4")

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        rectangle.setAttribute("opacity", "0.9")
        rectangle.setAttribute("stroke-width", "3")
      })
      group.addEventListener("mouseleave", () => {
        rectangle.setAttribute("opacity", "0.7")
        rectangle.setAttribute("stroke-width", "2")
      })

      group.appendChild(rectangle)

      // Add text if rectangle is large enough
      if (rect.width > 50 && rect.height > 20) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
        text.setAttribute("x", (rect.x + rect.width / 2).toString())
        text.setAttribute("y", (rect.y + rect.height / 2).toString())
        text.setAttribute("text-anchor", "middle")
        text.setAttribute("dominant-baseline", "middle")
        text.setAttribute("font-size", Math.min(14, rect.width / 6, rect.height / 3).toString())
        text.setAttribute("font-weight", "600")
        text.setAttribute("fill", "#ffffff")
        text.setAttribute("pointer-events", "none")
        text.textContent = rect.word
        group.appendChild(text)

        // Add count
        const countText = document.createElementNS("http://www.w3.org/2000/svg", "text")
        countText.setAttribute("x", (rect.x + rect.width / 2).toString())
        countText.setAttribute("y", (rect.y + rect.height / 2 + 15).toString())
        countText.setAttribute("text-anchor", "middle")
        countText.setAttribute("dominant-baseline", "middle")
        countText.setAttribute("font-size", Math.min(10, rect.width / 8, rect.height / 4).toString())
        countText.setAttribute("fill", "#ffffff")
        countText.setAttribute("opacity", "0.8")
        countText.setAttribute("pointer-events", "none")
        countText.textContent = `(${rect.count})`
        group.appendChild(countText)
      }

      svg.appendChild(group)
    })
  }, [data, width, height, enableSentiment])

  return <svg ref={svgRef} width={width} height={height} className="border rounded-lg bg-white" />
}
