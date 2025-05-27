"use client"

import React, { useEffect, useRef, useState, useCallback } from "react";
import **as d3 from 'd3';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Maximize2, Minimize2, RotateCcw, Zap, Target } from "lucide-react";

// Assuming wordTreeStore.ts is correctly pathed, e.g., from '@/store/wordTreeStore'
// Ensure WordNode and Settings are exported from your store file.
import { useWordTreeStore, WordNode as StoreWordNode, Settings as StoreSettings } from '@/store/wordTreeStore';

// Interface for text fragments, consistent with your original definition
interface TextFragment {
  before: string[];
  after: string[];
  fullSentence: string;
  position: number;
}

interface WordTreeProps {
  initialWidth?: number; // Changed from width to initialWidth
  initialHeight?: number; // Changed from height to initialHeight
  originalText?: string;
  // enableSentiment is not used by WordTree.tsx's logic, consider removing or implementing separately
}

export function WordTree({
  initialWidth = 800, // Default initial width
  initialHeight = 600, // Default initial height
  originalText = ""
}: WordTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // For dynamic sizing

  // Zustand store integration
  const {
    treeData,
    settings,
    searchTerm,
    highlightedWords,
    isExplorationMode,
    addToExplorationPath,
    setTreeData,
    // updateSettings, // If you add UI to change settings
    setSearchTerm,
    // setHighlightedWords, // If you add UI to highlight specific words beyond search
    // toggleExplorationMode, // If you add UI for this
  } = useWordTreeStore();

  const [selectedWordLocal, setSelectedWordLocal] = useState<string>("");
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default visualization dimensions, can be overridden by fullscreen or container size
  const D3_VIZ_WIDTH = 800;
  const D3_VIZ_HEIGHT = 600;

  // Text fragment extraction (from your original word-tree.tsx)
  const extractFragments = useCallback((text: string, targetWord: string): TextFragment[] => {
    if (!text || !targetWord) return [];

    const fragments: TextFragment[] = [];
    const sentences = text
      .replace(/[.!?]+/g, ".|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const targetLower = targetWord.toLowerCase();

    sentences.forEach((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).filter((w) => w.length > 0);
      words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
        if (cleanWord === targetLower || cleanWord.includes(targetLower)) {
          const before = words.slice(Math.max(0, index - 4), index);
          const after = words.slice(index + 1, Math.min(words.length, index + 6));
          if (after.length > 0) {
            fragments.push({
              before,
              after,
              fullSentence: sentence,
              position: sentenceIndex * 1000 + index,
            });
          }
        }
      });
    });
    return fragments;
  }, []);

  // Tree building logic (from your original word-tree.tsx, adapted to output StoreWordNode)
  const buildTreeFromFragments = useCallback((fragments: TextFragment[], targetWord: string): StoreWordNode => {
    const rootNode: StoreWordNode = {
      word: targetWord,
      count: fragments.length,
      children: [],
    };

    const firstWordGroups = new Map<string, TextFragment[]>();
    fragments.forEach((fragment) => {
      if (fragment.after.length > 0) {
        const firstWord = fragment.after[0].toLowerCase().replace(/[^\w]/g, "");
        if (firstWord && firstWord.length > 1) { // Ensure meaningful words
          if (!firstWordGroups.has(firstWord)) {
            firstWordGroups.set(firstWord, []);
          }
          firstWordGroups.get(firstWord)!.push(fragment);
        }
      }
    });

    Array.from(firstWordGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8) // Limit to top N children for clarity, adjust as needed
      .forEach(([firstWord, groupFragments]) => {
        const childNode: StoreWordNode = {
          word: firstWord,
          count: groupFragments.length,
          children: [],
        };

        const secondWordGroups = new Map<string, TextFragment[]>();
        groupFragments.forEach((fragment) => {
          if (fragment.after.length > 1) {
            const secondWord = fragment.after[1].toLowerCase().replace(/[^\w]/g, "");
            if (secondWord && secondWord.length > 1) { // Ensure meaningful words
              if (!secondWordGroups.has(secondWord)) {
                secondWordGroups.set(secondWord, []);
              }
              secondWordGroups.get(secondWord)!.push(fragment);
            }
          }
        });

        Array.from(secondWordGroups.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 4) // Limit sub-children
          .forEach(([secondWord, subFragments]) => {
            childNode.children?.push({
              word: secondWord,
              count: subFragments.length,
              children: [], // Can be extended for more depth
            });
          });
        rootNode.children?.push(childNode);
      });
    return rootNode;
  }, []);

  // Effect to update treeData in store when selectedWordLocal or originalText changes
  useEffect(() => {
    if (selectedWordLocal && originalText) {
      setSearchTerm(selectedWordLocal); // Keep searchTerm in sync
      const fragments = extractFragments(originalText, selectedWordLocal);
      if (fragments.length > 0) {
        const newTreeData = buildTreeFromFragments(fragments, selectedWordLocal);
        setTreeData(newTreeData);
      } else {
        setTreeData(null);
      }
    } else {
      setTreeData(null); // Clear tree if no word selected or no text
    }
  }, [selectedWordLocal, originalText, extractFragments, buildTreeFromFragments, setTreeData, setSearchTerm]);

  // Highlighting logic from WordTree.tsx
  const isWordHighlighted = (word: string) => {
    return highlightedWords.has(word.toLowerCase()) ||
           (searchTerm && word.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  // D3 Rendering Effect (adapted from WordTree.tsx)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    if (!treeData) {
      svg.selectAll("*").remove(); // Clear SVG if no data
      return;
    }
    svg.selectAll("*").remove(); // Clear previous rendering

    let currentWidth = D3_VIZ_WIDTH;
    let currentHeight = D3_VIZ_HEIGHT;

    if (isFullscreen) {
        currentWidth = window.innerWidth - (containerRef.current ? containerRef.current.offsetLeft * 2 : 40);
        currentHeight = window.innerHeight - (containerRef.current ? containerRef.current.offsetTop : 40) - 20;
    } else if (containerRef.current) {
        currentWidth = containerRef.current.clientWidth || D3_VIZ_WIDTH;
        // Use a fixed height or derive from props/container for non-fullscreen
        currentHeight = initialHeight;
    }


    const margin = { top: 40, right: 90, bottom: 40, left: 90 }; // Adjusted margins

    svg.attr("width", currentWidth).attr("height", currentHeight);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const d3TreeLayout = d3.tree<StoreWordNode>()
      .size([currentHeight - margin.top - margin.bottom, currentWidth - margin.left - margin.right]);

    const hierarchy = d3.hierarchy(treeData);
    const treeLayoutData = d3TreeLayout(hierarchy);

    // Links
    g.selectAll('.link')
      .data(treeLayoutData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, d3.HierarchyPointNode<StoreWordNode>>()
        .x(d => d.y) // Tree is horizontal: y position becomes x-coordinate
        .y(d => d.x)) // Tree is horizontal: x position becomes y-coordinate
      .style('fill', 'none')
      .style('stroke', (d, i) => {
        const isHighlighted = isWordHighlighted(d.target.data.word) || isWordHighlighted(d.source.data.word);
        return isHighlighted ? '#ff6b6b' : d3.interpolateRainbow(i / treeLayoutData.links().length);
      })
      .style('stroke-width', d => {
        const isHighlighted = isWordHighlighted(d.target.data.word) || isWordHighlighted(d.source.data.word);
        const baseWidth = Math.max(1, d.target.data.count * settings.linkThickness);
        return isHighlighted ? baseWidth * 1.5 : baseWidth; // Adjusted multiplier
      })
      .style('opacity', d => {
        const isHighlighted = isWordHighlighted(d.target.data.word) || isWordHighlighted(d.source.data.word);
        return isHighlighted ? 1 : (searchTerm || highlightedWords.size > 0 ? 0.3 : 0.7); // Adjusted opacity
      })
      .style('transition', 'all 0.3s ease');

    // Nodes
    const nodes = g.selectAll('.node')
      .data(treeLayoutData.descendants() as d3.HierarchyPointNode<StoreWordNode>[])
      .enter()
      .append('g')
      .attr('class', d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr('transform', d => `translate(${d.y},${d.x})`) // y for x-pos, x for y-pos
      .style('cursor', 'pointer');

    nodes.append('circle')
      .attr('r', d => {
        const isHighlighted = isWordHighlighted(d.data.word);
        const baseSize = Math.max(settings.nodeSize * 1.5, d.data.count * settings.nodeSize * 0.5); // Adjusted sizing
        return isHighlighted ? baseSize * 1.5 : baseSize;
      })
      .style('fill', (d, i) => {
        const isHighlighted = isWordHighlighted(d.data.word);
        if (isHighlighted) return '#ff6b6b';
        return d.children ? d3.interpolateBlues(0.6) : d3.interpolateGreens(0.6); // Different color for parent/leaf
      })
      .style('stroke', d => isWordHighlighted(d.data.word) ? '#ff4757' : '#555')
      .style('stroke-width', d => isWordHighlighted(d.data.word) ? 2.5 : 1.5)
      .style('opacity', d => {
        const isHighlighted = isWordHighlighted(d.data.word);
        return isHighlighted ? 1 : (searchTerm || highlightedWords.size > 0 ? 0.5 : 1);
      })
      .style('transition', 'all 0.3s ease')
      .on('click', function(event, dNode) {
        if (isExplorationMode) {
          addToExplorationPath(dNode.data.word);
          d3.select(this).transition().duration(150)
            .attr('r', prevR => +prevR * 1.5) // Use +prevR to ensure number
            .transition().duration(150)
            .attr('r', prevR => +prevR / 1.5);
        } else {
          // If not in exploration mode, clicking a child node could set it as the new selectedWordLocal
          if (dNode.data.word !== selectedWordLocal) { // Avoid re-selecting the root
             setSelectedWordLocal(dNode.data.word);
          }
        }
      })
      .on('mouseover', function(event, dNode) {
        d3.select(this).transition().duration(150)
          .attr('r', prevR => +prevR * 1.2)
          .style('stroke-width', 2.5);
        
        d3.selectAll('.tooltip').remove(); // Clear existing tooltips
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip') // Ensure this class is styled (e.g., in global CSS)
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.85)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('pointer-events', 'none')
          .style('font-size', '13px')
          .style('z-index', '1050') // Ensure tooltip is on top
          .style('opacity', 0) // Start hidden for transition
          .html(`<strong>${dNode.data.word}</strong><br/>Frequência: ${dNode.data.count}<br/>${isExplorationMode ? 'Clique para adicionar ao caminho' : (dNode.data.word !== selectedWordLocal ? 'Clique para explorar esta palavra' : 'Palavra raiz')}`);
        
        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.style('left', (event.pageX + 15) + 'px')
               .style('top', (event.pageY - 20) + 'px');
      })
      .on('mouseout', function(event, dNode) {
        d3.select(this).transition().duration(150)
          .attr('r', prevR => +prevR / 1.2) // Revert to original dynamic size
          .style('stroke-width', isWordHighlighted(dNode.data.word) ? 2.5 : 1.5);
        d3.selectAll('.tooltip').transition().duration(200).style('opacity', 0).remove();
      });

    // Text labels
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? - (Math.max(settings.nodeSize * 1.5, d.data.count * settings.nodeSize * 0.5) + 5) : (Math.max(settings.nodeSize * 1.5, d.data.count * settings.nodeSize * 0.5) + 5))
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .style('font-size', d => {
        const isHighlighted = isWordHighlighted(d.data.word);
        const baseSize = Math.max(10, Math.min(20, d.data.count * settings.fontSize * 0.8)); // Clamp font size
        return (isHighlighted ? baseSize * 1.15 : baseSize) + 'px';
      })
      .style('font-weight', d => isWordHighlighted(d.data.word) || d.data.word === selectedWordLocal ? 'bold' : 'normal')
      .style('fill', d => isWordHighlighted(d.data.word) ? '#d63031' : '#333') // Darker highlight color
      .style('opacity', d => {
        const isHighlighted = isWordHighlighted(d.data.word);
        return isHighlighted ? 1 : (searchTerm || highlightedWords.size > 0 ? 0.6 : 1);
      })
      .text(d => d.data.word);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3]) // Adjusted scale extent
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

  }, [
      treeData, settings, searchTerm, highlightedWords, isExplorationMode, addToExplorationPath,
      isFullscreen, initialHeight, selectedWordLocal // Dependencies for D3 rerender
  ]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Initialize or update available words from originalText
  useEffect(() => {
    if (originalText) {
      const words = originalText.toLowerCase().match(/\b(\w{3,})\b/g) || []; // Min 3 letter words
      const wordCounts: Record<string, number> = {};
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      const sortedWords = Object.entries(wordCounts)
        .filter(([, count]) => count > 1) // Only words appearing more than once
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);
      
      setAvailableWords(sortedWords);
      if (!selectedWordLocal && sortedWords.length > 0) {
        setSelectedWordLocal(sortedWords[0]);
      } else if (sortedWords.length === 0 && selectedWordLocal) {
        // If current selected word is no longer available, clear it
        setSelectedWordLocal("");
      }
    } else {
      setAvailableWords([]);
      setSelectedWordLocal("");
    }
  }, [originalText]); // Rerun only if originalText changes

  // Handle word selection from buttons
  const handleWordSelection = (word: string) => {
    setSelectedWordLocal(word);
  };
  
  // Refresh handler
  const handleRefresh = () => {
    if (selectedWordLocal && originalText) {
      setSearchTerm(selectedWordLocal);
      const fragments = extractFragments(originalText, selectedWordLocal);
      if (fragments.length > 0) {
        const newTreeData = buildTreeFromFragments(fragments, selectedWordLocal);
        setTreeData(newTreeData);
      } else {
        setTreeData(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Word Selector */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Selecione uma palavra para explorar contextos</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleFullscreen} className="rounded-xl">
                {isFullscreen ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
                {isFullscreen ? "Sair" : "Tela Cheia"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl">
                <RotateCcw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableWords.length > 0 ? availableWords.slice(0, 15).map((word) => (
              <button
                key={word}
                onClick={() => handleWordSelection(word)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  selectedWordLocal === word
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-md"
                }`}
              >
                {word}
              </button>
            )) : <p className="text-sm text-gray-500">Nenhuma palavra frequente encontrada no texto fornecido.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tree Visualization */}
      <div className={`${isFullscreen ? "fixed inset-0 z-[1040] bg-white p-5 flex flex-col" : "relative"}`}>
        <Card className={`shadow-2xl border-0 bg-white ${isFullscreen ? "flex-grow" : ""}`}>
          <CardContent className={`p-0 ${isFullscreen ? "h-full" : ""}`}>
            <div
              ref={containerRef}
              className={`relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 ${
                isFullscreen ? "h-full rounded-2xl" : "rounded-2xl"
              }`}
              style={!isFullscreen ? { width: '100%', height: `${initialHeight}px`, minHeight: `${initialHeight}px` } : {}}
            >
              {!treeData && selectedWordLocal && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-5">
                    <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold text-gray-500">
                      Gerando visualização para "{selectedWordLocal}"...
                    </p>
                     <p className="text-sm text-gray-400">Se demorar, verifique o texto ou a palavra selecionada.</p>
                  </div>
                </div>
              )}
               {!selectedWordLocal && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-5">
                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-semibold text-gray-500">
                      Selecione uma palavra acima para visualizar a árvore contextual.
                    </p>
                  </div>
                </div>
              )}
              <svg
                ref={svgRef}
                className="w-full h-full" // D3 controls size attributes directly
                style={{ fontFamily: "system-ui, sans-serif", background: "transparent" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Information */}
      {selectedWordLocal && treeData && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise de "{selectedWordLocal}"
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div className="bg-white/60 rounded-xl p-4 shadow">
                <div className="text-3xl font-black text-green-800">{treeData.count}</div>
                <div className="text-xs font-semibold">Ocorrências da raiz</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow">
                <div className="text-3xl font-black text-green-800">{treeData.children?.length || 0}</div>
                <div className="text-xs font-semibold">Contextos diretos (Nível 1)</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow">
                <div className="text-3xl font-black text-green-800">
                  {treeData.children?.reduce((sum, child) => sum + (child.children?.length || 0), 0) || 0}
                </div>
                <div className="text-xs font-semibold">Sub-contextos (Nível 2)</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-green-600">
              A árvore visualiza como "{selectedWordLocal}" se conecta a palavras subsequentes no texto fornecido.
              O tamanho dos nós e a espessura dos links são influenciados pela frequência e pelas configurações.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
