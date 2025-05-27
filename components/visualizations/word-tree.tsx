"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Maximize2, Minimize2, RotateCcw, Zap, Target } from "lucide-react"

interface TextFragment {
  before: string[]
  after: string[]
  fullSentence: string
  position: number
}

interface TreeNode {
  text: string
  frequency: number
  children: TreeNode[]
  level: number
  x?: number
  y?: number
  width?: number
  height?: number
  color?: string
  fontSize?: number
}

interface WordTreeProps {
  data: Array<{ word: string; count: number; sentiment?: { category: string; score: number } }>
  width: number
  height: number
  enableSentiment: boolean
  originalText?: string
}

export function WordTree({ data, width, height, enableSentiment, originalText = "" }: WordTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedWord, setSelectedWord] = useState<string>("")
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [treeStructure, setTreeStructure] = useState<TreeNode | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: width, height: height })

  // Enhanced text fragment extraction
  const extractFragments = useCallback((text: string, targetWord: string): TextFragment[] => {
    if (!text || !targetWord) return []

    const fragments: TextFragment[] = []
    const sentences = text
      .replace(/[.!?]+/g, ".|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const targetLower = targetWord.toLowerCase()

    sentences.forEach((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).filter((w) => w.length > 0)

      words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, "")
        if (cleanWord === targetLower || cleanWord.includes(targetLower)) {
          const before = words.slice(Math.max(0, index - 4), index)
          const after = words.slice(index + 1, Math.min(words.length, index + 6))

          if (after.length > 0) {
            fragments.push({
              before,
              after,
              fullSentence: sentence,
              position: sentenceIndex * 1000 + index,
            })
          }
        }
      })
    })

    return fragments
  }, [])

  // Enhanced tree building with better hierarchy
  const buildTree = useCallback((fragments: TextFragment[], targetWord: string): TreeNode => {
    const root: TreeNode = {
      text: targetWord,
      frequency: fragments.length,
      children: [],
      level: 0,
      color: "#1a1a1a",
      fontSize: 48,
    }

    // Group fragments by first word after target
    const firstWordGroups = new Map<string, TextFragment[]>()

    fragments.forEach((fragment) => {
      if (fragment.after.length > 0) {
        const firstWord = fragment.after[0].toLowerCase().replace(/[^\w]/g, "")
        if (firstWord && firstWord.length > 1) {
          if (!firstWordGroups.has(firstWord)) {
            firstWordGroups.set(firstWord, [])
          }
          firstWordGroups.get(firstWord)!.push(fragment)
        }
      }
    })

    // Create first level children
    Array.from(firstWordGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .forEach(([firstWord, groupFragments]) => {
        const childNode: TreeNode = {
          text: firstWord,
          frequency: groupFragments.length,
          children: [],
          level: 1,
          color: "#2563eb",
          fontSize: Math.max(16, Math.min(32, 16 + (groupFragments.length / fragments.length) * 16)),
        }

        // Group by second word for sub-branches
        const secondWordGroups = new Map<string, TextFragment[]>()
        groupFragments.forEach((fragment) => {
          if (fragment.after.length > 1) {
            const secondWord = fragment.after[1].toLowerCase().replace(/[^\w]/g, "")
            if (secondWord && secondWord.length > 1) {
              if (!secondWordGroups.has(secondWord)) {
                secondWordGroups.set(secondWord, [])
              }
              secondWordGroups.get(secondWord)!.push(fragment)
            }
          }
        })

        // Create second level children
        Array.from(secondWordGroups.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 4)
          .forEach(([secondWord, subFragments]) => {
            childNode.children.push({
              text: secondWord,
              frequency: subFragments.length,
              children: [],
              level: 2,
              color: "#64748b",
              fontSize: Math.max(12, Math.min(20, 12 + (subFragments.length / groupFragments.length) * 8)),
            })
          })

        root.children.push(childNode)
      })

    return root
  }, [])

  // Enhanced layout calculation with better spacing
  const calculateLayout = useCallback((tree: TreeNode, containerWidth: number, containerHeight: number) => {
    const margin = 60
    const levelSpacing = Math.max(180, containerWidth / 6)
    const nodeSpacing = Math.max(40, containerHeight / 15)

    const assignPositions = (node: TreeNode, x: number, y: number, availableHeight: number) => {
      node.x = x
      node.y = y

      if (node.children.length === 0) return availableHeight

      const totalChildren = node.children.length
      const childHeight = nodeSpacing
      const totalHeight = totalChildren * childHeight
      const startY = y - totalHeight / 2

      let currentY = startY
      node.children.forEach((child, index) => {
        const childY = currentY + index * childHeight
        const childX = x + levelSpacing

        assignPositions(child, childX, childY, childHeight)
        currentY = childY
      })

      return totalHeight
    }

    // Center the root node
    const rootX = margin + 100
    const rootY = containerHeight / 2

    assignPositions(tree, rootX, rootY, containerHeight - 2 * margin)
  }, [])

  // Enhanced rendering with beautiful visuals
  const renderTree = useCallback(() => {
    if (!treeStructure || !svgRef.current) return

    const svg = svgRef.current
    const containerWidth = dimensions.width
    const containerHeight = dimensions.height

    // Clear previous content
    svg.innerHTML = ""

    // Set SVG attributes
    svg.setAttribute("width", containerWidth.toString())
    svg.setAttribute("height", containerHeight.toString())
    svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`)

    // Create gradient definitions
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")

    // Connection gradient
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    gradient.setAttribute("id", "connectionGradient")
    gradient.setAttribute("x1", "0%")
    gradient.setAttribute("y1", "0%")
    gradient.setAttribute("x2", "100%")
    gradient.setAttribute("y2", "0%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", "#3b82f6")
    stop1.setAttribute("stop-opacity", "0.8")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", "#8b5cf6")
    stop2.setAttribute("stop-opacity", "0.4")

    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)
    svg.appendChild(defs)

    // Add background
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    background.setAttribute("width", "100%")
    background.setAttribute("height", "100%")
    background.setAttribute("fill", "url(#backgroundGradient)")

    const bgGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    bgGradient.setAttribute("id", "backgroundGradient")
    bgGradient.setAttribute("x1", "0%")
    bgGradient.setAttribute("y1", "0%")
    bgGradient.setAttribute("x2", "100%")
    bgGradient.setAttribute("y2", "100%")

    const bgStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    bgStop1.setAttribute("offset", "0%")
    bgStop1.setAttribute("stop-color", "#fefefe")

    const bgStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    bgStop2.setAttribute("offset", "100%")
    bgStop2.setAttribute("stop-color", "#f8fafc")

    bgGradient.appendChild(bgStop1)
    bgGradient.appendChild(bgStop2)
    defs.appendChild(bgGradient)
    background.setAttribute("fill", "url(#backgroundGradient)")
    svg.appendChild(background)

    // Calculate layout
    calculateLayout(treeStructure, containerWidth, containerHeight)

    // Render connections first (so they appear behind text)
    const renderConnections = (node: TreeNode) => {
      if (!node.x || !node.y) return

      node.children.forEach((child) => {
        if (child.x && child.y) {
          // Create curved connection
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
          const startX = node.x + node.text.length * (node.fontSize || 20) * 0.4
          const startY = node.y
          const endX = child.x - 20
          const endY = child.y
          const midX = startX + (endX - startX) * 0.6

          const pathData = `M ${startX} ${startY} Q ${midX} ${startY} ${endX} ${endY}`
          path.setAttribute("d", pathData)
          path.setAttribute("stroke", "url(#connectionGradient)")
          path.setAttribute("stroke-width", Math.max(1, child.frequency / 2).toString())
          path.setAttribute("fill", "none")
          path.setAttribute("opacity", "0.6")

          svg.appendChild(path)
        }
        renderConnections(child)
      })
    }

    // Render text nodes
    const renderNode = (node: TreeNode) => {
      if (!node.x || !node.y) return

      // Create group for node
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.style.cursor = "pointer"
      group.setAttribute("data-word", node.text)

      // Add background for root node
      if (node.level === 0) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        const padding = 20
        const textWidth = node.text.length * (node.fontSize || 20) * 0.6
        const textHeight = node.fontSize || 20

        rect.setAttribute("x", (node.x - padding).toString())
        rect.setAttribute("y", (node.y - textHeight / 2 - padding / 2).toString())
        rect.setAttribute("width", (textWidth + padding * 2).toString())
        rect.setAttribute("height", (textHeight + padding).toString())
        rect.setAttribute("fill", "#f8fafc")
        rect.setAttribute("stroke", "#e2e8f0")
        rect.setAttribute("stroke-width", "2")
        rect.setAttribute("rx", "12")
        rect.setAttribute("opacity", "0.9")
        group.appendChild(rect)
      }

      // Create text element
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", node.x.toString())
      text.setAttribute("y", node.y.toString())
      text.setAttribute("font-size", (node.fontSize || 16).toString())
      text.setAttribute("font-weight", node.level === 0 ? "900" : node.level === 1 ? "700" : "600")
      text.setAttribute("fill", node.color || "#333")
      text.setAttribute("dominant-baseline", "middle")
      text.setAttribute("text-anchor", node.level === 0 ? "middle" : "start")
      text.setAttribute("font-family", "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
      text.textContent = node.text

      // Add frequency badge for non-root nodes
      if (node.level > 0 && node.frequency > 1) {
        const badge = document.createElementNS("http://www.w3.org/2000/svg", "text")
        badge.setAttribute("x", (node.x + node.text.length * (node.fontSize || 16) * 0.6 + 10).toString())
        badge.setAttribute("y", (node.y - 5).toString())
        badge.setAttribute("font-size", "10")
        badge.setAttribute("font-weight", "600")
        badge.setAttribute("fill", "#6b7280")
        badge.setAttribute("dominant-baseline", "middle")
        badge.setAttribute("text-anchor", "start")
        badge.textContent = `×${node.frequency}`
        group.appendChild(badge)
      }

      // Add hover effects
      group.addEventListener("mouseenter", () => {
        text.setAttribute("fill", "#2563eb")
        text.setAttribute("font-weight", (Number.parseInt(text.getAttribute("font-weight") || "400") + 100).toString())
        setHoveredNode(node.text)
      })

      group.addEventListener("mouseleave", () => {
        text.setAttribute("fill", node.color || "#333")
        text.setAttribute("font-weight", node.level === 0 ? "900" : node.level === 1 ? "700" : "600")
        setHoveredNode(null)
      })

      // Add click handler for word selection
      group.addEventListener("click", () => {
        if (node.level > 0) {
          setSelectedWord(node.text)
        }
      })

      // Add tooltip
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title")
      title.textContent = `"${node.text}" appears ${node.frequency} time${node.frequency !== 1 ? "s" : ""} in this context`
      group.appendChild(title)

      group.appendChild(text)
      svg.appendChild(group)

      // Render children
      node.children.forEach(renderNode)
    }

    // Render connections first, then nodes
    renderConnections(treeStructure)
    renderNode(treeStructure)

    // Add title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    titleText.setAttribute("x", "30")
    titleText.setAttribute("y", "40")
    titleText.setAttribute("font-size", "18")
    titleText.setAttribute("font-weight", "700")
    titleText.setAttribute("fill", "#1f2937")
    titleText.textContent = `Contextos de "${selectedWord}"`
    svg.appendChild(titleText)

    // Add instructions
    const instructionText = document.createElementNS("http://www.w3.org/2000/svg", "text")
    instructionText.setAttribute("x", "30")
    instructionText.setAttribute("y", containerHeight - 30)
    instructionText.setAttribute("font-size", "12")
    instructionText.setAttribute("font-weight", "500")
    instructionText.setAttribute("fill", "#6b7280")
    instructionText.textContent = "Tamanhos das fontes indicam frequência • Clique nas palavras para explorar"
    svg.appendChild(instructionText)
  }, [treeStructure, dimensions, selectedWord, calculateLayout])

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setDimensions({ width: window.innerWidth - 40, height: window.innerHeight - 40 })
    } else {
      setDimensions({ width: width, height: height })
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen, width, height])

  // Initialize available words
  useEffect(() => {
    if (data.length > 0) {
      const words = data.slice(0, 20).map((d) => d.word)
      setAvailableWords(words)

      if (!selectedWord && words.length > 0) {
        setSelectedWord(words[0])
      }
    }
  }, [data, selectedWord])

  // Build tree when word or text changes
  useEffect(() => {
    if (selectedWord && originalText) {
      const fragments = extractFragments(originalText, selectedWord)
      if (fragments.length > 0) {
        const tree = buildTree(fragments, selectedWord)
        setTreeStructure(tree)
      }
    }
  }, [selectedWord, originalText, extractFragments, buildTree])

  // Render tree when structure or dimensions change
  useEffect(() => {
    if (treeStructure) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(renderTree, 100)
      return () => clearTimeout(timer)
    }
  }, [treeStructure, renderTree])

  // Handle window resize in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const handleResize = () => {
        setDimensions({ width: window.innerWidth - 40, height: window.innerHeight - 40 })
      }
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [isFullscreen])

  return (
    <div className="space-y-6">
      {/* Word Selector */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Selecione uma palavra para explorar seus contextos</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="rounded-xl">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? "Sair" : "Tela Cheia"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => renderTree()} className="rounded-xl">
                <RotateCcw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {availableWords.slice(0, 15).map((word) => (
              <button
                key={word}
                onClick={() => setSelectedWord(word)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  selectedWord === word
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-md"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tree Visualization */}
      <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white p-5" : "relative"}`}>
        <Card className={`shadow-2xl border-0 bg-white ${isFullscreen ? "h-full" : ""}`}>
          <CardContent className="p-0">
            <div
              ref={containerRef}
              className={`relative overflow-hidden bg-gradient-to-br from-gray-50 to-white ${
                isFullscreen ? "h-full rounded-2xl" : "rounded-2xl"
              }`}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                minHeight: isFullscreen ? "100%" : "600px",
              }}
            >
              {!treeStructure && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold text-gray-500">
                      Selecione uma palavra para ver a árvore contextual
                    </p>
                  </div>
                </div>
              )}

              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  background: "transparent",
                }}
              />

              {/* Floating info panel */}
              {hoveredNode && (
                <div className="absolute top-4 right-4 bg-black/90 text-white px-4 py-2 rounded-xl text-sm shadow-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">Palavra em foco: {hoveredNode}</span>
                  </div>
                </div>
              )}

              {/* Fullscreen indicator */}
              {isFullscreen && (
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                  Modo Tela Cheia
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Information */}
      {selectedWord && treeStructure && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise de "{selectedWord}"
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-2xl font-black text-green-800">{treeStructure.frequency}</div>
                <div className="text-xs font-semibold">Total de ocorrências</div>
              </div>
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-2xl font-black text-green-800">{treeStructure.children.length}</div>
                <div className="text-xs font-semibold">Contextos únicos</div>
              </div>
              <div className="bg-white/50 rounded-xl p-4">
                <div className="text-2xl font-black text-green-800">
                  {treeStructure.children.reduce((sum, child) => sum + child.children.length, 0)}
                </div>
                <div className="text-xs font-semibold">Sub-contextos</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-green-700">
              Esta visualização mostra como "{selectedWord}" é usado em diferentes contextos no texto. Tamanhos maiores
              indicam maior frequência de uso.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
