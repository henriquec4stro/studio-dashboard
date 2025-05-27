"use client"

import { useEffect, useRef } from "react"

interface WordBarChartProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
}

export function WordBarChart({ data, width, height, enableSentiment }: WordBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data.length || !svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ""

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const maxCount = Math.max(...data.map((d) => d.count))
    const barData = data.slice(0, 15)
    const barWidth = chartWidth / barData.length
    const barSpacing = barWidth * 0.1

    // Draw bars
    barData.forEach((item, index) => {
      const barHeight = (item.count / maxCount) * chartHeight
      const x = margin.left + index * barWidth + barSpacing / 2
      const y = margin.top + chartHeight - barHeight

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"

      // Draw bar
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("x", x.toString())
      rect.setAttribute("y", y.toString())
      rect.setAttribute("width", (barWidth - barSpacing).toString())
      rect.setAttribute("height", barHeight.toString())

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

      rect.setAttribute("fill", fillColor)
      rect.setAttribute("opacity", "0.8")
      rect.setAttribute("rx", "4")

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        rect.setAttribute("opacity", "1")
      })
      group.addEventListener("mouseleave", () => {
        rect.setAttribute("opacity", "0.8")
      })

      group.appendChild(rect)

      // Add value label on top of bar
      const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      valueText.setAttribute("x", (x + (barWidth - barSpacing) / 2).toString())
      valueText.setAttribute("y", (y - 5).toString())
      valueText.setAttribute("text-anchor", "middle")
      valueText.setAttribute("font-size", "11")
      valueText.setAttribute("font-weight", "500")
      valueText.setAttribute("fill", "#374151")
      valueText.setAttribute("pointer-events", "none")
      valueText.textContent = item.count.toString()
      group.appendChild(valueText)

      // Add word label on x-axis
      const wordText = document.createElementNS("http://www.w3.org/2000/svg", "text")
      wordText.setAttribute("x", (x + (barWidth - barSpacing) / 2).toString())
      wordText.setAttribute("y", (margin.top + chartHeight + 20).toString())
      wordText.setAttribute("text-anchor", "middle")
      wordText.setAttribute("font-size", "10")
      wordText.setAttribute("fill", "#6b7280")
      wordText.setAttribute("pointer-events", "none")
      wordText.setAttribute(
        "transform",
        `rotate(-45, ${x + (barWidth - barSpacing) / 2}, ${margin.top + chartHeight + 20})`,
      )
      wordText.textContent = item.word
      group.appendChild(wordText)

      svg.appendChild(group)
    })

    // Draw axes
    // Y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    yAxis.setAttribute("x1", margin.left.toString())
    yAxis.setAttribute("y1", margin.top.toString())
    yAxis.setAttribute("x2", margin.left.toString())
    yAxis.setAttribute("y2", (margin.top + chartHeight).toString())
    yAxis.setAttribute("stroke", "#e5e7eb")
    yAxis.setAttribute("stroke-width", "2")
    svg.appendChild(yAxis)

    // X-axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    xAxis.setAttribute("x1", margin.left.toString())
    xAxis.setAttribute("y1", (margin.top + chartHeight).toString())
    xAxis.setAttribute("x2", (margin.left + chartWidth).toString())
    xAxis.setAttribute("y2", (margin.top + chartHeight).toString())
    xAxis.setAttribute("stroke", "#e5e7eb")
    xAxis.setAttribute("stroke-width", "2")
    svg.appendChild(xAxis)

    // Y-axis label
    const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
    yLabel.setAttribute("x", "20")
    yLabel.setAttribute("y", (margin.top + chartHeight / 2).toString())
    yLabel.setAttribute("text-anchor", "middle")
    yLabel.setAttribute("font-size", "12")
    yLabel.setAttribute("fill", "#6b7280")
    yLabel.setAttribute("transform", `rotate(-90, 20, ${margin.top + chartHeight / 2})`)
    yLabel.textContent = "Frequência"
    svg.appendChild(yLabel)
  }, [data, width, height, enableSentiment])

  return <svg ref={svgRef} width={width} height={height} className="border rounded-lg bg-white" />
}
