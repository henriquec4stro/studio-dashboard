"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  Palette,
  Type,
  BarChart3,
  Cloud,
  Settings,
  Sparkles,
  Filter,
  CheckCircle,
  AlertCircle,
  Languages,
  Heart,
  Frown,
  Meh,
  Smile,
  TreePine,
  Circle,
  Network,
  SplineIcon as Spiral,
  Grid3x3,
  BarChart,
  Eye,
  EyeOff,
  Brain,
  BookOpen,
  Maximize2,
} from "lucide-react"

import { analyzeSentiment, getSentimentColor, calculateOverallSentiment } from "@/lib/sentiment-lexicon"
import { WordTree } from "@/components/visualizations/word-tree"
import { BubbleChart } from "@/components/visualizations/bubble-chart"
import { WordNetwork } from "@/components/visualizations/word-network"
import { WordSpiral } from "@/components/visualizations/word-spiral"
import { WordTreemap } from "@/components/visualizations/word-treemap"
import { WordBarChart } from "@/components/visualizations/word-bar-chart"

// Embedded stopwords to avoid import issues
const PORTUGUESE_STOPWORDS = [
  "de",
  "a",
  "o",
  "que",
  "e",
  "do",
  "da",
  "em",
  "um",
  "para",
  "é",
  "com",
  "não",
  "uma",
  "os",
  "no",
  "se",
  "na",
  "por",
  "mais",
  "as",
  "dos",
  "como",
  "mas",
  "foi",
  "ao",
  "ele",
  "das",
  "tem",
  "à",
  "seu",
  "sua",
  "ou",
  "ser",
  "quando",
  "muito",
  "há",
  "nos",
  "já",
  "está",
  "eu",
  "também",
  "só",
  "pelo",
  "pela",
  "até",
  "isso",
  "ela",
  "entre",
  "era",
  "depois",
  "sem",
  "mesmo",
  "aos",
  "ter",
  "seus",
  "quem",
  "nas",
  "me",
  "esse",
  "eles",
  "estão",
  "você",
  "tinha",
  "foram",
  "essa",
  "num",
  "nem",
  "suas",
  "meu",
  "às",
  "minha",
  "têm",
  "numa",
  "pelos",
  "elas",
  "havia",
  "seja",
  "qual",
  "será",
  "nós",
  "tenho",
  "lhe",
  "deles",
  "essas",
  "esses",
  "pelas",
  "este",
  "fosse",
  "dele",
  "tu",
  "te",
  "vocês",
  "vos",
  "lhes",
  "meus",
  "minhas",
  "teu",
  "tua",
  "teus",
  "tuas",
  "nosso",
  "nossa",
  "nossos",
  "nossas",
  "dela",
  "delas",
  "esta",
  "estes",
  "estas",
  "aquele",
  "aquela",
  "aqueles",
  "aquelas",
  "isto",
  "aquilo",
  "sobre",
  "onde",
  "quais",
  "quão",
  "quanta",
  "quantas",
  "quanto",
  "quantos",
]

// Paletas de cores baseadas em sentimento
const sentimentColorPalettes = {
  sentiment: {
    positive: ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d"],
    negative: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"],
    neutral: ["#6b7280", "#4b5563", "#374151", "#1f2937", "#111827"],
  },
  mixed: {
    positive: ["#22c55e", "#34d399", "#6ee7b7"],
    negative: ["#ef4444", "#f87171", "#fca5a5"],
    neutral: ["#6b7280", "#9ca3af", "#d1d5db"],
  },
}

// Paletas de cores tradicionais
const colorPalettes = {
  vibrant: ["#ff6f61", "#ffb347", "#fdfd96", "#77dd77", "#aec6cf", "#9b9b9b", "#f7cac9", "#a2d5f2"],
  pastel: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec"],
  grayscale: ["#202020", "#404040", "#606060", "#808080", "#A0A0A0", "#C0C0C0", "#E0E0E0"],
  ocean: ["#003f5c", "#2f4b7c", "#665191", "#a05195", "#d45087", "#f95d6a", "#ff7c43", "#ffa600"],
  sunset: ["#ff9a9e", "#fecfef", "#fecfef", "#ffc3a0", "#ff9a9e", "#a8e6cf", "#dcedc1", "#ffd3a5"],
  forest: ["#2d5016", "#3e6b1f", "#4f7942", "#5d8a3a", "#6b9b37", "#79a353", "#87ab69", "#95b37e"],
  tropical: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd", "#98d8c8", "#f7dc6f"],
  corporate: ["#2c3e50", "#34495e", "#7f8c8d", "#95a5a6", "#bdc3c7", "#ecf0f1", "#3498db", "#9b59b6"],
}

// Opções de fonte
const fontOptions = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Times New Roman", serif', label: "Times New Roman" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: '"Courier New", monospace', label: "Courier New" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: '"Helvetica Neue", sans-serif', label: "Helvetica Neue" },
  { value: '"Roboto", sans-serif', label: "Roboto" },
  { value: '"Open Sans", sans-serif', label: "Open Sans" },
]

// Tipos de visualização
const visualizationTypes = [
  {
    value: "tree",
    label: "Árvore Contextual",
    icon: TreePine,
    description: "Análise hierárquica de contextos textuais",
    category: "Contexto",
    featured: true,
    premium: true,
  },
  {
    value: "wordcloud",
    label: "Nuvem de Palavras",
    icon: Cloud,
    description: "Visualização clássica proporcional à frequência",
    category: "Frequência",
  },
  {
    value: "bubble",
    label: "Gráfico de Bolhas",
    icon: Circle,
    description: "Bolhas interativas com análise de sentimento",
    category: "Frequência",
  },
  {
    value: "network",
    label: "Rede Semântica",
    icon: Network,
    description: "Conexões inteligentes entre palavras",
    category: "Relações",
  },
  {
    value: "spiral",
    label: "Espiral Dinâmica",
    icon: Spiral,
    description: "Disposição em espiral com gradientes",
    category: "Estética",
  },
  {
    value: "treemap",
    label: "Mapa Hierárquico",
    icon: Grid3x3,
    description: "Retângulos proporcionais aninhados",
    category: "Hierarquia",
  },
  {
    value: "barchart",
    label: "Gráfico de Barras",
    icon: BarChart,
    description: "Comparação direta de frequências",
    category: "Comparação",
  },
]

interface WordFrequency {
  word: string
  count: number
  rank: number
  isFiltered?: boolean
  sentiment?: {
    score: number
    category: "positive" | "negative" | "neutral"
  }
}

interface FilteringStats {
  totalWords: number
  uniqueWords: number
  filteredWords: number
  stopWordsRemoved: number
  finalWords: number
  filteringEfficiency: number
}

interface SentimentStats {
  overall: "positive" | "negative" | "neutral"
  score: number
  weightedScore: number
  distribution: {
    positive: number
    negative: number
    neutral: number
  }
}

export default function WordCloudDashboard() {
  const [text, setText] = useState("")
  const [maxWords, setMaxWords] = useState(100)
  const [colorPalette, setColorPalette] = useState("vibrant")
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif")
  const [visualizationType, setVisualizationType] = useState("tree")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [zoom, setZoom] = useState(1.4)
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([])
  const [filteredWords, setFilteredWords] = useState<WordFrequency[]>([])
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [filteringStats, setFilteringStats] = useState<FilteringStats>({
    totalWords: 0,
    uniqueWords: 0,
    filteredWords: 0,
    stopWordsRemoved: 0,
    finalWords: 0,
    filteringEfficiency: 0,
  })

  // Controles de filtragem de stopwords
  const [enableStopwordFilter, setEnableStopwordFilter] = useState(true)
  const [customStopwords, setCustomStopwords] = useState<string[]>([])
  const [newStopword, setNewStopword] = useState("")
  const [showFilteredWords, setShowFilteredWords] = useState(false)
  const [minWordLength, setMinWordLength] = useState(2)
  const [stopwordList, setStopwordList] = useState<string[]>(PORTUGUESE_STOPWORDS)

  // Controles de análise de sentimento
  const [enableSentimentAnalysis, setEnableSentimentAnalysis] = useState(true)
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    overall: "neutral",
    score: 0,
    weightedScore: 0,
    distribution: { positive: 0, negative: 0, neutral: 0 },
  })
  const [showSentimentDetails, setShowSentimentDetails] = useState(false)

  // Estado para controlar se o container está pronto
  const [containerReady, setContainerReady] = useState(false)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Observar mudanças no container para garantir que está pronto
  useEffect(() => {
    const checkContainer = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setContainerDimensions({ width: rect.width, height: rect.height })
          setContainerReady(true)
        }
      }
    }

    // Verificar imediatamente
    checkContainer()

    // Verificar após um pequeno delay
    const timer = setTimeout(checkContainer, 100)

    // Observar mudanças de tamanho
    const resizeObserver = new ResizeObserver(checkContainer)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [visualizationType])

  // Carregar scripts externos
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        // Verificar se o script já existe
        const existingScript = document.querySelector(`script[src="${src}"]`)
        if (existingScript) {
          // Se já existe, verificar se a biblioteca está disponível
          if ((window as any).WordCloud) {
            resolve(true)
          } else {
            // Aguardar um pouco e verificar novamente
            setTimeout(() => {
              if ((window as any).WordCloud) {
                resolve(true)
              } else {
                reject(new Error(`Library not loaded from ${src}`))
              }
            }, 1000)
          }
          return
        }

        const script = document.createElement("script")
        script.src = src
        script.onload = () => {
          // Aguardar um pouco para garantir que a biblioteca está disponível
          setTimeout(() => {
            if ((window as any).WordCloud) {
              resolve(true)
            } else {
              reject(new Error(`Library not available after loading ${src}`))
            }
          }, 100)
        }
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.head.appendChild(script)
      })
    }

    // Initialize stopwords
    setStopwordList(PORTUGUESE_STOPWORDS)
    console.log(`Carregadas ${PORTUGUESE_STOPWORDS.length} stopwords em português`)

    // Load WordCloud library sempre, mas só usar quando necessário
    loadScript("/wordcloud2.js")
      .then(() => {
        console.log("WordCloud library loaded successfully")
      })
      .catch((error) => {
        console.error("Failed to load WordCloud library:", error)
      })
  }, [])

  const processText = useCallback(
    (rawText: string, maxWords: number) => {
      // Limpar texto
      let cleanedText = rawText.toLowerCase()
      cleanedText = cleanedText.replace(/[^a-záéíóúàèìòùâêîôûãõç\s]/gi, " ")
      cleanedText = cleanedText.replace(/\s+/g, " ").trim()

      // Tokenizar
      const allTokens = cleanedText.split(/\s+/).filter((word) => word.length >= minWordLength)

      // Criar lista combinada de stopwords
      const combinedStopwords = new Set(
        [...(enableStopwordFilter ? stopwordList : []), ...customStopwords].map((word) => word.toLowerCase()),
      )

      // Separar tokens filtrados e removidos
      const filteredTokens: string[] = []
      const removedTokens: string[] = []

      allTokens.forEach((token) => {
        if (combinedStopwords.has(token.toLowerCase())) {
          removedTokens.push(token)
        } else {
          filteredTokens.push(token)
        }
      })

      // Contar frequências para todas as palavras
      const allFrequencyMap = new Map<string, number>()
      allTokens.forEach((token) => {
        allFrequencyMap.set(token, (allFrequencyMap.get(token) || 0) + 1)
      })

      // Contar frequências para palavras filtradas
      const filteredFrequencyMap = new Map<string, number>()
      filteredTokens.forEach((token) => {
        filteredFrequencyMap.set(token, (filteredFrequencyMap.get(token) || 0) + 1)
      })

      // Contar frequências para palavras removidas
      const removedFrequencyMap = new Map<string, number>()
      removedTokens.forEach((token) => {
        removedFrequencyMap.set(token, (removedFrequencyMap.get(token) || 0) + 1)
      })

      // Ordenar e limitar palavras filtradas
      const sortedFilteredWords = Array.from(filteredFrequencyMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, maxWords)

      // Ordenar palavras removidas
      const sortedRemovedWords = Array.from(removedFrequencyMap.entries()).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )

      // Calcular eficiência da filtragem
      const filteringEfficiency = allTokens.length > 0 ? Math.round((removedTokens.length / allTokens.length) * 100) : 0

      // Atualizar estatísticas
      const stats: FilteringStats = {
        totalWords: allTokens.length,
        uniqueWords: allFrequencyMap.size,
        filteredWords: filteredFrequencyMap.size,
        stopWordsRemoved: removedFrequencyMap.size,
        finalWords: sortedFilteredWords.length,
        filteringEfficiency,
      }
      setFilteringStats(stats)

      // Análise de sentimento
      const wordsWithSentiment = sortedFilteredWords.map(([word, count]) => {
        const sentiment = enableSentimentAnalysis ? analyzeSentiment(word) : { score: 0, category: "neutral" as const }
        return { word, count, sentiment }
      })

      // Calcular estatísticas de sentimento
      if (enableSentimentAnalysis) {
        const sentimentAnalysis = calculateOverallSentiment(wordsWithSentiment)
        setSentimentStats(sentimentAnalysis)
      }

      // Criar dados de frequência para exibição
      const frequencies: WordFrequency[] = wordsWithSentiment.map(({ word, count, sentiment }, index) => ({
        word,
        count,
        rank: index + 1,
        isFiltered: false,
        sentiment,
      }))

      const filtered: WordFrequency[] = sortedRemovedWords.map(([word, count], index) => ({
        word,
        count,
        rank: index + 1,
        isFiltered: true,
        sentiment: enableSentimentAnalysis ? analyzeSentiment(word) : undefined,
      }))

      setWordFrequencies(frequencies)
      setFilteredWords(filtered)
      return sortedFilteredWords
    },
    [enableStopwordFilter, stopwordList, customStopwords, minWordLength, enableSentimentAnalysis],
  )

  const generateVisualization = useCallback(async () => {
    if (!text.trim()) {
      setError("Por favor, insira algum texto para gerar a visualização.")
      return
    }

    setIsGenerating(true)
    setError("")
    setProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const processedWords = processText(text, maxWords)

      if (processedWords.length === 0) {
        setError(
          "Nenhuma palavra significativa encontrada após a filtragem. Tente ajustar as configurações de stopwords ou adicionar mais texto.",
        )
        clearInterval(progressInterval)
        setIsGenerating(false)
        return
      }

      // Para word cloud, verificar se canvas está disponível
      if (visualizationType === "wordcloud") {
        // Aguardar container estar pronto
        if (!containerReady || !canvasRef.current || !containerRef.current) {
          setError("Aguardando container estar pronto...")

          // Tentar novamente após um delay
          setTimeout(() => {
            if (containerReady && canvasRef.current && containerRef.current) {
              generateVisualization()
            }
          }, 500)

          clearInterval(progressInterval)
          setIsGenerating(false)
          return
        }

        // Verificar se a biblioteca WordCloud está carregada
        if (!(window as any).WordCloud) {
          setError("Biblioteca WordCloud não está carregada. Recarregue a página e tente novamente.")
          clearInterval(progressInterval)
          setIsGenerating(false)
          return
        }

        // Configurar canvas com dimensões do container
        const canvas = canvasRef.current
        const container = containerRef.current

        // Usar dimensões fixas mínimas se o container não tiver tamanho
        const canvasWidth = Math.max(containerDimensions.width || 800, 600)
        const canvasHeight = Math.max(containerDimensions.height || 600, 400)

        canvas.width = canvasWidth
        canvas.height = canvasHeight

        // Limpar canvas
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        // Função de cor baseada em sentimento ou paleta tradicional
        let colorFunction
        if (enableSentimentAnalysis && (colorPalette === "sentiment" || colorPalette === "mixed")) {
          colorFunction = (word: string) => {
            const sentiment = analyzeSentiment(word)
            const wordData = wordFrequencies.find((w) => w.word === word)
            const intensity = wordData ? Math.min(3, Math.max(1, Math.abs(sentiment.score))) : 1

            if (colorPalette === "sentiment") {
              return getSentimentColor(sentiment.category, intensity)
            } else {
              // Mixed palette
              const colors = sentimentColorPalettes.mixed[sentiment.category]
              const colorIndex = Math.floor(Math.random() * colors.length)
              return colors[colorIndex]
            }
          }
        } else if (colorPalette === "random-dark" || colorPalette === "random-light") {
          colorFunction = colorPalette
        } else {
          const colors = colorPalettes[colorPalette as keyof typeof colorPalettes]
          let colorIndex = 0
          colorFunction = () => colors[colorIndex++ % colors.length]
        }

        // Opções do WordCloud com tamanhos maiores
        const options = {
          list: processedWords,
          gridSize: Math.max(3, Math.round((10 * canvas.width) / 800)),
          weightFactor: (size: number) => Math.max(16, Math.pow(size, 0.8) * (canvas.width / 60)),
          fontFamily: fontFamily,
          color: colorFunction,
          backgroundColor: "transparent",
          rotateRatio: 0.3,
          rotationSteps: 2,
          shape: "circle",
          minSize: Math.max(12, Math.round(canvas.width / 80)),
          drawOutOfBound: false,
          shrinkToFit: true,
          hover: (item: any, dimension: any, event: any) => {
            if (item && event.target) {
              const sentiment = enableSentimentAnalysis ? analyzeSentiment(item[0]) : null
              const sentimentText = sentiment ? ` | Sentimento: ${sentiment.category} (${sentiment.score})` : ""
              event.target.title = `${item[0]} (${item[1]} ${item[1] === 1 ? "ocorrência" : "ocorrências"})${sentimentText}`
              setHighlightedWord(item[0])
            }
          },
          click: (item: any) => {
            if (item) {
              setHighlightedWord(item[0])
            }
          },
        }

        clearInterval(progressInterval)
        setProgress(95)

        // Gerar nuvem de palavras
        try {
          ;(window as any).WordCloud(canvas, options)
          setProgress(100)
          setTimeout(() => setProgress(0), 1000)
        } catch (wordCloudError) {
          console.error("Erro ao gerar WordCloud:", wordCloudError)
          setError("Erro ao gerar nuvem de palavras. Tente novamente.")
        }
      } else {
        // Para outras visualizações, apenas processar os dados
        clearInterval(progressInterval)
        setProgress(100)
        setTimeout(() => setProgress(0), 1000)
      }
    } catch (err) {
      console.error("Erro ao gerar visualização:", err)
      setError("Falha ao gerar visualização. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }, [
    text,
    maxWords,
    colorPalette,
    fontFamily,
    visualizationType,
    processText,
    enableSentimentAnalysis,
    wordFrequencies,
    containerReady,
    containerDimensions,
  ])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3.0))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.3))
  const handleZoomReset = () => setZoom(1.4)

  const downloadVisualization = () => {
    if (visualizationType === "wordcloud" && canvasRef.current) {
      const link = document.createElement("a")
      link.download = `${visualizationType}-sentimento.png`
      link.href = canvasRef.current.toDataURL()
      link.click()
    } else {
      // Para SVG visualizations, implementar download SVG
      const svgElement = containerRef.current?.querySelector("svg")
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const svgUrl = URL.createObjectURL(svgBlob)
        const link = document.createElement("a")
        link.download = `${visualizationType}-sentimento.svg`
        link.href = svgUrl
        link.click()
        URL.revokeObjectURL(svgUrl)
      }
    }
  }

  const addCustomStopword = () => {
    if (newStopword.trim() && !customStopwords.includes(newStopword.trim().toLowerCase())) {
      setCustomStopwords([...customStopwords, newStopword.trim().toLowerCase()])
      setNewStopword("")
    }
  }

  const removeCustomStopword = (word: string) => {
    setCustomStopwords(customStopwords.filter((w) => w !== word))
  }

  const loadSampleText = () => {
    setText(`A inteligência artificial está transformando o mundo de maneiras extraordinárias e revolucionárias. 
    Desde assistentes virtuais incríveis até carros autônomos fantásticos, a tecnologia está criando soluções inovadoras. 
    Machine learning e deep learning são tecnologias brilhantes que processam dados de forma eficiente. 
    Algoritmos sofisticados e poderosos geram insights valiosos para empresas prósperas. 
    A automação inteligente está criando oportunidades maravilhosas no mercado de trabalho. 
    Redes neurais artificiais simulam o funcionamento do cérebro humano de maneira impressionante. 
    A computação em nuvem oferece infraestrutura robusta e confiável para processar algoritmos avançados. 
    Big data e analytics permitem descobertas surpreendentes e análises precisas. 
    A internet das coisas conecta dispositivos de forma harmoniosa em ecossistemas digitais integrados. 
    Blockchain garante segurança excepcional e transparência total para transações digitais. 
    Realidade virtual e aumentada criam experiências imersivas e educativas fantásticas.
    Infelizmente, alguns desafios persistem como problemas de privacidade preocupantes e questões éticas complexas.
    Riscos de segurança cibernética representam ameaças sérias que podem causar danos significativos.
    A dependência excessiva da tecnologia pode gerar ansiedade e isolamento social prejudicial.
    Entretanto, os benefícios superam os riscos quando implementamos soluções responsáveis e éticas.
    Os dados são fundamentais para o desenvolvimento de algoritmos inteligentes. Dados de qualidade geram insights precisos.
    Quando analisamos dados corretamente, descobrimos padrões importantes. Os dados revelam tendências ocultas no mercado.
    Dados estruturados facilitam a análise automatizada. Dados não estruturados requerem processamento especial.
    A coleta de dados deve seguir princípios éticos rigorosos. Dados pessoais precisam de proteção adequada.
    Algoritmos de machine learning aprendem com dados históricos para fazer previsões futuras.
    Modelos de deep learning processam grandes volumes de dados para reconhecer padrões complexos.
    A qualidade dos dados determina a precisão dos resultados dos algoritmos de inteligência artificial.`)
  }

  const getSentimentIcon = (category: "positive" | "negative" | "neutral") => {
    switch (category) {
      case "positive":
        return <Smile className="h-4 w-4 text-green-600" />
      case "negative":
        return <Frown className="h-4 w-4 text-red-600" />
      case "neutral":
      default:
        return <Meh className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentBadgeColor = (category: "positive" | "negative" | "neutral") => {
    switch (category) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200"
      case "negative":
        return "bg-red-100 text-red-800 border-red-200"
      case "neutral":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderVisualization = () => {
    const containerWidth = containerDimensions.width || 1000
    const containerHeight = 700

    switch (visualizationType) {
      case "tree":
        return (
          <WordTree
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
            originalText={text}
          />
        )
      case "bubble":
        return (
          <BubbleChart
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
          />
        )
      case "network":
        return (
          <WordNetwork
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
          />
        )
      case "spiral":
        return (
          <WordSpiral
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
          />
        )
      case "treemap":
        return (
          <WordTreemap
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
          />
        )
      case "barchart":
        return (
          <WordBarChart
            data={wordFrequencies}
            width={containerWidth}
            height={containerHeight}
            enableSentiment={enableSentimentAnalysis}
          />
        )
      case "wordcloud":
      default:
        return (
          <div className="relative w-full h-full min-h-[600px]">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 transition-transform duration-200 ease-out cursor-pointer"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        )
    }
  }

  const currentVisualization = visualizationTypes.find((v) => v.value === visualizationType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              <div className="relative p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl">
                <TreePine className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                TextViz Pro
              </h1>
              <p className="text-xl text-slate-600 font-semibold">Análise Contextual Avançada</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-2xl text-slate-700 leading-relaxed mb-6">
              Explore <span className="font-bold text-purple-600">contextos hierárquicos</span> em seus textos através
              de
              <span className="font-bold text-blue-600"> árvores de palavras interativas</span>
            </p>
            <p className="text-lg text-slate-600">
              Descubra como palavras são usadas em diferentes contextos e revele padrões linguísticos ocultos
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg border border-slate-200">
              <BookOpen className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-bold text-slate-700">Análise Textual</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg border border-slate-200">
              <TreePine className="h-6 w-6 text-green-500" />
              <span className="text-sm font-bold text-slate-700">Árvore Contextual</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg border border-slate-200">
              <Maximize2 className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-bold text-slate-700">Tela Cheia</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Configuração</div>
                    <div className="text-sm text-slate-500 font-normal">Configure sua análise</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="text-input" className="text-sm font-bold mb-3 block text-slate-700">
                    Texto de Entrada
                  </Label>
                  <Textarea
                    id="text-input"
                    placeholder="Cole seu texto aqui para análise contextual..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    className="resize-none border-2 border-slate-200 focus:border-purple-400 transition-all duration-200 rounded-xl"
                  />
                  <Button variant="outline" size="sm" onClick={loadSampleText} className="mt-3 w-full rounded-xl">
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Texto de Exemplo
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-bold mb-3 block text-slate-700">Tipo de Visualização</Label>
                  <Select value={visualizationType} onValueChange={setVisualizationType}>
                    <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visualizationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-3 py-2">
                            <div
                              className={`p-2 rounded-lg ${
                                type.featured
                                  ? "bg-gradient-to-r from-blue-100 to-purple-100"
                                  : "bg-gradient-to-r from-slate-100 to-slate-200"
                              }`}
                            >
                              <type.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {type.label}
                                {type.featured && (
                                  <Badge variant="secondary" className="text-xs">
                                    Destaque
                                  </Badge>
                                )}
                                {type.premium && (
                                  <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{type.description}</div>
                              <div className="text-xs text-purple-600 font-medium">{type.category}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-bold mb-3 block text-slate-700">Máximo de Palavras: {maxWords}</Label>
                  <Slider
                    value={[maxWords]}
                    onValueChange={(value) => setMaxWords(value[0])}
                    max={300}
                    min={20}
                    step={10}
                    className="w-full"
                  />
                </div>

                {visualizationType === "wordcloud" && (
                  <>
                    <div>
                      <Label className="text-sm font-bold mb-3 block text-slate-700">
                        <Palette className="h-4 w-4 inline mr-2" />
                        Paleta de Cores
                      </Label>
                      <Select value={colorPalette} onValueChange={setColorPalette}>
                        <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sentiment">🎭 Baseada em Sentimento</SelectItem>
                          <SelectItem value="mixed">🌈 Sentimento Misto</SelectItem>
                          <Separator className="my-2" />
                          <SelectItem value="vibrant">Vibrante</SelectItem>
                          <SelectItem value="pastel">Pastel</SelectItem>
                          <SelectItem value="ocean">Oceano</SelectItem>
                          <SelectItem value="sunset">Pôr do Sol</SelectItem>
                          <SelectItem value="forest">Floresta</SelectItem>
                          <SelectItem value="tropical">Tropical</SelectItem>
                          <SelectItem value="corporate">Corporativo</SelectItem>
                          <SelectItem value="grayscale">Escala de Cinza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-bold mb-3 block text-slate-700">
                        <Type className="h-4 w-4 inline mr-2" />
                        Família da Fonte
                      </Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="border-2 border-slate-200 focus:border-purple-400 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button
                  onClick={generateVisualization}
                  disabled={isGenerating || !text.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                      Analisando Contextos...
                    </>
                  ) : (
                    <>
                      {currentVisualization?.icon && (
                        <>
                          {React.createElement(currentVisualization.icon, {
                            className: "h-5 w-5 mr-3",
                          })}
                        </>
                      )}
                      Gerar {currentVisualization?.label}
                    </>
                  )}
                </Button>

                {progress > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Progresso da Análise</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-3 rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Sentiment Analysis */}
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl shadow-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Análise de Sentimento</div>
                    <div className="text-sm text-slate-500 font-normal">IA emocional avançada</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-slate-700">Ativar Análise de Sentimento</Label>
                    <p className="text-xs text-muted-foreground">
                      IA analisa automaticamente o tom emocional das palavras
                    </p>
                  </div>
                  <Switch checked={enableSentimentAnalysis} onCheckedChange={setEnableSentimentAnalysis} />
                </div>

                {enableSentimentAnalysis && sentimentStats.overall && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-slate-700">Sentimento Geral</Label>
                        <Badge className={`${getSentimentBadgeColor(sentimentStats.overall)} px-4 py-2 rounded-xl`}>
                          {getSentimentIcon(sentimentStats.overall)}
                          <span className="ml-2 capitalize font-bold">{sentimentStats.overall}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-lg">
                          <div className="text-2xl font-black text-green-700">
                            {sentimentStats.distribution.positive}%
                          </div>
                          <div className="text-xs text-green-600 font-bold">Positivo</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 shadow-lg">
                          <div className="text-2xl font-black text-gray-700">
                            {sentimentStats.distribution.neutral}%
                          </div>
                          <div className="text-xs text-gray-600 font-bold">Neutro</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200 shadow-lg">
                          <div className="text-2xl font-black text-red-700">
                            {sentimentStats.distribution.negative}%
                          </div>
                          <div className="text-xs text-red-600 font-bold">Negativo</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {enableSentimentAnalysis && (
                  <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <Brain className="h-4 w-4" />
                    <AlertDescription className="text-blue-800 text-xs font-semibold">
                      🧠 IA treinada com mais de 1000 palavras em português para análise emocional precisa
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Filtering Controls */}
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-lg">
                    <Languages className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Filtragem Inteligente</div>
                    <div className="text-sm text-slate-500 font-normal">Controle avançado de ruído</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-slate-700">Filtro de Stopwords</Label>
                    <p className="text-xs text-muted-foreground">Remove automaticamente palavras irrelevantes</p>
                  </div>
                  <Switch checked={enableStopwordFilter} onCheckedChange={setEnableStopwordFilter} />
                </div>

                <div>
                  <Label className="text-sm font-bold mb-3 block text-slate-700">
                    Tamanho Mínimo da Palavra: {minWordLength}
                  </Label>
                  <Slider
                    value={[minWordLength]}
                    onValueChange={(value) => setMinWordLength(value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                {enableStopwordFilter && (
                  <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 text-xs font-semibold">
                      ✨ {stopwordList.length} stopwords em português + {customStopwords.length} personalizadas
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Visualization Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                        {currentVisualization?.icon && (
                          <>
                            {React.createElement(currentVisualization.icon, {
                              className: "h-6 w-6 text-white",
                            })}
                          </>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-black">{currentVisualization?.label || "Visualização"}</div>
                        <div className="text-sm text-slate-500 font-normal">{currentVisualization?.description}</div>
                        <div className="text-xs text-purple-600 font-bold mt-1">{currentVisualization?.category}</div>
                      </div>
                      {enableStopwordFilter && (
                        <Badge variant="outline" className="ml-4 border-green-300 text-green-700 px-3 py-1 rounded-xl">
                          <Filter className="h-3 w-3 mr-1" />
                          Filtrada
                        </Badge>
                      )}
                      {enableSentimentAnalysis && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-purple-300 text-purple-700 px-3 py-1 rounded-xl"
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          IA Sentimento
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {visualizationType === "wordcloud" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={zoom <= 0.3}
                          className="rounded-xl"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleZoomReset} className="rounded-xl">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={zoom >= 3.0}
                          className="rounded-xl"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadVisualization}
                      disabled={wordFrequencies.length === 0}
                      className="rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700 font-semibold">{error}</AlertDescription>
                  </Alert>
                )}

                <div
                  ref={containerRef}
                  className="relative w-full h-[700px] border-2 border-dashed border-slate-300 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-inner"
                >
                  {wordFrequencies.length === 0 && !isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        {currentVisualization?.icon && (
                          <>
                            {React.createElement(currentVisualization.icon, {
                              className: "h-24 w-24 mx-auto mb-8 opacity-20",
                            })}
                          </>
                        )}
                        <p className="text-3xl font-bold mb-4">Sua {currentVisualization?.label} aparecerá aqui</p>
                        <p className="text-xl">Digite um texto e descubra conexões contextuais ocultas</p>
                      </div>
                    </div>
                  )}

                  {wordFrequencies.length > 0 && renderVisualization()}

                  {highlightedWord && (
                    <div className="absolute top-6 left-6 bg-black/95 text-white px-6 py-4 rounded-2xl text-sm shadow-2xl">
                      <strong className="text-xl">{highlightedWord}</strong>
                      {wordFrequencies.find((w) => w.word === highlightedWord) && (
                        <span className="ml-4 opacity-90">
                          ({wordFrequencies.find((w) => w.word === highlightedWord)?.count} ocorrências)
                          {enableSentimentAnalysis &&
                            wordFrequencies.find((w) => w.word === highlightedWord)?.sentiment && (
                              <span className="ml-4">
                                |{" "}
                                {getSentimentIcon(
                                  wordFrequencies.find((w) => w.word === highlightedWord)?.sentiment?.category ||
                                    "neutral",
                                )}
                                <span className="ml-2 capitalize">
                                  {wordFrequencies.find((w) => w.word === highlightedWord)?.sentiment?.category}
                                </span>
                              </span>
                            )}
                        </span>
                      )}
                    </div>
                  )}

                  {visualizationType === "wordcloud" && (
                    <div className="absolute bottom-6 right-6 bg-black/95 text-white px-4 py-3 rounded-2xl text-sm shadow-2xl">
                      Zoom: {Math.round(zoom * 100)}%
                    </div>
                  )}

                  {enableStopwordFilter && (
                    <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-2xl text-sm shadow-2xl">
                      <Filter className="h-4 w-4 inline mr-2" />
                      Filtragem Ativa
                    </div>
                  )}

                  {enableSentimentAnalysis && (
                    <div className="absolute top-20 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-2xl text-sm shadow-2xl">
                      <Heart className="h-4 w-4 inline mr-2" />
                      IA Sentimento
                    </div>
                  )}

                  {/* Container status indicator */}
                  {!containerReady && (
                    <div className="absolute bottom-6 left-6 bg-yellow-500 text-white px-4 py-3 rounded-2xl text-sm shadow-2xl">
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Preparando container...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Word Analysis */}
            {(wordFrequencies.length > 0 || filteredWords.length > 0) && (
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black">Análise Detalhada</div>
                      <div className="text-sm text-slate-500 font-normal">Insights profundos sobre seu texto</div>
                    </div>
                    {enableSentimentAnalysis && (
                      <Badge variant="outline" className="ml-4 border-purple-300 text-purple-700 px-3 py-1 rounded-xl">
                        <Brain className="h-3 w-3 mr-1" />
                        IA Insights
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="included" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl p-2">
                      <TabsTrigger value="included" className="flex items-center gap-2 rounded-xl">
                        <Eye className="h-4 w-4" />
                        Palavras Incluídas ({wordFrequencies.length})
                      </TabsTrigger>
                      <TabsTrigger value="filtered" className="flex items-center gap-2 rounded-xl">
                        <EyeOff className="h-4 w-4" />
                        Palavras Filtradas ({filteredWords.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="included" className="mt-6">
                      <ScrollArea className="h-80 w-full">
                        <div className="space-y-3">
                          {wordFrequencies.slice(0, 20).map((item) => (
                            <div
                              key={item.word}
                              className={`flex justify-between items-center p-5 rounded-2xl transition-all cursor-pointer border-2 shadow-lg ${
                                highlightedWord === item.word
                                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-purple-300 shadow-xl scale-105"
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 hover:shadow-xl"
                              }`}
                              onClick={() => setHighlightedWord(item.word)}
                            >
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-xs font-black px-3 py-2 rounded-xl">
                                  #{item.rank}
                                </Badge>
                                <span className="font-black text-xl">{item.word}</span>
                                {enableSentimentAnalysis && item.sentiment && (
                                  <Badge
                                    className={`text-xs ${getSentimentBadgeColor(item.sentiment.category)} px-4 py-2 rounded-xl`}
                                  >
                                    {getSentimentIcon(item.sentiment.category)}
                                    <span className="ml-2 capitalize font-bold">{item.sentiment.category}</span>
                                    {item.sentiment.score !== 0 && (
                                      <span className="ml-2 font-black">({item.sentiment.score})</span>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-black text-slate-700">{item.count}</div>
                                <div className="text-xs text-slate-500 font-semibold">ocorrências</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="filtered" className="mt-6">
                      <ScrollArea className="h-80 w-full">
                        <div className="space-y-3">
                          {filteredWords.slice(0, 20).map((item) => (
                            <div
                              key={item.word}
                              className="flex justify-between items-center p-5 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-lg"
                            >
                              <div className="flex items-center gap-4">
                                <Badge variant="destructive" className="text-xs font-black px-4 py-2 rounded-xl">
                                  <Filter className="h-3 w-3 mr-1" />
                                  Filtrada
                                </Badge>
                                <span className="font-black text-xl text-red-700">{item.word}</span>
                                {enableSentimentAnalysis && item.sentiment && (
                                  <Badge
                                    className={`text-xs ${getSentimentBadgeColor(item.sentiment.category)} px-4 py-2 rounded-xl`}
                                  >
                                    {getSentimentIcon(item.sentiment.category)}
                                    <span className="ml-2 capitalize font-bold">{item.sentiment.category}</span>
                                    {item.sentiment.score !== 0 && (
                                      <span className="ml-2 font-black">({item.sentiment.score})</span>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-black text-red-600">{item.count}</div>
                                <div className="text-xs text-red-500 font-semibold">ocorrências</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
