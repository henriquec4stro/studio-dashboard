"use client"

import { useEffect, useRef } from "react"

interface WordNetworkProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
}

export function WordNetwork({ data, width, height, enableSentiment }: WordNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ""

    const nodes = data.slice(0, 20).map((item, index) => ({
      ...item,
      id: index,
      x: width / 2 + (Math.random() - 0.5) * width * 0.8,
      y: height / 2 + (Math.random() - 0.5) * height * 0.8,
      radius: Math.max(8, Math.min(25, item.count * 1.5)),
    }))

    // Create connections based on word similarity (simplified)
    const links: Array<{ source: number; target: number; strength: number }> = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const word1 = nodes[i].word
        const word2 = nodes[j].word

        // Simple similarity based on first letter and length
        let similarity = 0
        if (word1[0] === word2[0]) similarity += 0.3
        if (Math.abs(word1.length - word2.length) <= 1) similarity += 0.2
        if (word1.includes(word2.substring(0, 2)) || word2.includes(word1.substring(0, 2))) similarity += 0.5

        if (similarity > 0.3 && Math.random() > 0.7) {
          links.push({ source: i, target: j, strength: similarity })
        }
      }
    }

    // Draw links
    links.forEach((link) => {
      const sourceNode = nodes[link.source]
      const targetNode = nodes[link.target]

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.setAttribute("x1", sourceNode.x.toString())
      line.setAttribute("y1", sourceNode.y.toString())
      line.setAttribute("x2", targetNode.x.toString())
      line.setAttribute("y2", targetNode.y.toString())
      line.setAttribute("stroke", "#e2e8f0")
      line.setAttribute("stroke-width", (link.strength * 3).toString())
      line.setAttribute("opacity", "0.6")
      svg.appendChild(line)
    })

    // Draw nodes
    nodes.forEach((node) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"

      // Draw circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", node.x.toString())
      circle.setAttribute("cy", node.y.toString())
      circle.setAttribute("r", node.radius.toString())

      let fillColor = "#3b82f6"
      if (enableSentiment && node.sentiment) {
        switch (node.sentiment.category) {
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
      circle.setAttribute("opacity", "0.8")
      circle.setAttribute("stroke", "#ffffff")
      circle.setAttribute("stroke-width", "2")

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        circle.setAttribute("opacity", "1")
        circle.setAttribute("stroke-width", "3")
      })
      group.addEventListener("mouseleave", () => {
        circle.setAttribute("opacity", "0.8")
        circle.setAttribute("stroke-width", "2")
      })

      group.appendChild(circle)

      // Add text label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", node.x.toString())
      text.setAttribute("y", (node.y + node.radius + 15).toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("font-size", "11")
      text.setAttribute("font-weight", "500")
      text.setAttribute("fill", "#1f2937")
      text.setAttribute("pointer-events", "none")
      text.textContent = node.word
      group.appendChild(text)

      svg.appendChild(group)
    })
  }, [data, width, height, enableSentiment])

  return <svg ref={svgRef} width={width} height={height} className="border rounded-lg bg-white" />
}
