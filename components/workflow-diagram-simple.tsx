"use client"

interface WorkflowDiagramProps {
  workflowType: string
}

export default function WorkflowDiagram({ workflowType }: WorkflowDiagramProps) {
  // Define diagram configurations for each workflow type
  const diagrams = {
    sample: {
      levels: 3,
      nodesPerLevel: [3, 3, 3],
      connections: [
        // [from_level, from_index, to_level, to_index]
        [0, 0, 1, 0], // t1 -> t4
        [0, 1, 1, 1], // t2 -> t5
        [0, 2, 1, 2], // t3 -> t6
        [1, 0, 2, 0], // t4 -> t7
        [1, 1, 2, 1], // t5 -> t8
        [1, 2, 2, 2], // t6 -> t9
      ],
      description: "A simple three-level workflow with 9 tasks and direct dependencies between levels.",
    },
    montage: {
      levels: 9,
      nodesPerLevel: [5, 5, 5, 5, 1, 1, 1, 5, 1],
      connections: [
        // Level 1 to 2
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 2, 1, 2],
        [0, 3, 1, 3],
        [0, 4, 1, 4],
        // Level 2 to 3
        [1, 0, 2, 0],
        [1, 1, 2, 1],
        [1, 2, 2, 2],
        [1, 3, 2, 3],
        [1, 4, 2, 4],
        // Level 3 to 4
        [2, 0, 3, 0],
        [2, 1, 3, 1],
        [2, 2, 3, 2],
        [2, 3, 3, 3],
        [2, 4, 3, 4],
        // Level 4 to 5
        [3, 0, 4, 0],
        [3, 1, 4, 0],
        [3, 2, 4, 0],
        [3, 3, 4, 0],
        [3, 4, 4, 0],
        // Level 5 to 6
        [4, 0, 5, 0],
        // Level 6 to 7
        [5, 0, 6, 0],
        // Level 7 to 8
        [6, 0, 7, 0],
        [6, 0, 7, 1],
        [6, 0, 7, 2],
        [6, 0, 7, 3],
        [6, 0, 7, 4],
        // Level 8 to 9
        [7, 0, 8, 0],
        [7, 1, 8, 0],
        [7, 2, 8, 0],
        [7, 3, 8, 0],
        [7, 4, 8, 0],
      ],
      description:
        "Montage workflows have many levels with a mix of serial and parallel tasks. Several levels have single-threaded tasks that must execute serially.",
    },
    cybershake: {
      levels: 5,
      nodesPerLevel: [3, 8, 8, 0, 1],
      connections: [
        // Level 1 to 2 (many-to-many)
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 2],
        [0, 1, 1, 3],
        [0, 1, 1, 4],
        [0, 1, 1, 5],
        [0, 2, 1, 6],
        [0, 2, 1, 7],
        // Level 2 to 3 (one-to-one)
        [1, 0, 2, 0],
        [1, 1, 2, 1],
        [1, 2, 2, 2],
        [1, 3, 2, 3],
        [1, 4, 2, 4],
        [1, 5, 2, 5],
        [1, 6, 2, 6],
        [1, 7, 2, 7],
        // Level 3 to 5 (all-to-one)
        [2, 0, 4, 0],
        [2, 1, 4, 0],
        [2, 2, 4, 0],
        [2, 3, 4, 0],
        [2, 4, 4, 0],
        [2, 5, 4, 0],
        [2, 6, 4, 0],
        [2, 7, 4, 0],
      ],
      description:
        "CyberShake workflows have intense parallelism in middle levels. Levels 2 and 3 contain nearly 99% of all tasks with high concurrency.",
    },
    ligo: {
      levels: 6,
      nodesPerLevel: [5, 5, 5, 5, 5, 1],
      connections: [
        // Level 1 to 2
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 2, 1, 2],
        [0, 3, 1, 3],
        [0, 4, 1, 4],
        // Level 2 to 3
        [1, 0, 2, 0],
        [1, 1, 2, 1],
        [1, 2, 2, 2],
        [1, 3, 2, 3],
        [1, 4, 2, 4],
        // Level 3 to 4
        [2, 0, 3, 0],
        [2, 1, 3, 1],
        [2, 2, 3, 2],
        [2, 3, 3, 3],
        [2, 4, 3, 4],
        // Level 4 to 5
        [3, 0, 4, 0],
        [3, 1, 4, 1],
        [3, 2, 4, 2],
        [3, 3, 4, 3],
        [3, 4, 4, 4],
        // Level 5 to 6 (all to one)
        [4, 0, 5, 0],
        [4, 1, 5, 0],
        [4, 2, 5, 0],
        [4, 3, 5, 0],
        [4, 4, 5, 0],
      ],
      description:
        "LIGO workflows have many CPU-intensive tasks with large runtime variations. Task runtimes can vary by a factor of 3 compared to the mean.",
    },
    epigenomics: {
      levels: 8,
      nodesPerLevel: [3, 3, 3, 3, 6, 6, 8, 1],
      connections: [
        // Level 1 to 2
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 2, 1, 2],
        // Level 2 to 3
        [1, 0, 2, 0],
        [1, 1, 2, 1],
        [1, 2, 2, 2],
        // Level 3 to 4
        [2, 0, 3, 0],
        [2, 1, 3, 1],
        [2, 2, 3, 2],
        // Level 4 to 5 (one-to-many)
        [3, 0, 4, 0],
        [3, 0, 4, 1],
        [3, 1, 4, 2],
        [3, 1, 4, 3],
        [3, 2, 4, 4],
        [3, 2, 4, 5],
        // Level 5 to 6 (one-to-one)
        [4, 0, 5, 0],
        [4, 1, 5, 1],
        [4, 2, 5, 2],
        [4, 3, 5, 3],
        [4, 4, 5, 4],
        [4, 5, 5, 5],
        // Level 6 to 7 (many-to-many)
        [5, 0, 6, 0],
        [5, 1, 6, 1],
        [5, 2, 6, 2],
        [5, 3, 6, 3],
        [5, 4, 6, 4],
        [5, 5, 6, 5],
        [5, 0, 6, 6],
        [5, 1, 6, 7],
        // Level 7 to 8 (all-to-one)
        [6, 0, 7, 0],
        [6, 1, 7, 0],
        [6, 2, 7, 0],
        [6, 3, 7, 0],
        [6, 4, 7, 0],
        [6, 5, 7, 0],
        [6, 6, 7, 0],
        [6, 7, 7, 0],
      ],
      description:
        "Epigenomics workflows have extreme runtime variations. Task runtimes can vary by factors of 7,000 or more, with Level 5 containing tasks that account for 99.8% of total execution time.",
    },
  }

  // Define colors for different levels (using a color palette)
  const levelColors = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#84cc16", // lime-500
  ]

  // Get the diagram configuration for the selected workflow type
  const diagram = diagrams[workflowType] || diagrams.sample

  // Calculate dimensions
  const width = 800
  const height = diagram.levels * 100 + 50
  const levelHeight = 100
  const nodeRadius = 20

  // Function to calculate node positions
  const getNodePosition = (level: number, index: number, nodesInLevel: number) => {
    const levelWidth = width - 100
    const spacing = levelWidth / (nodesInLevel + 1)
    const x = 50 + spacing * (index + 1)
    const y = 50 + level * levelHeight
    return { x, y }
  }

  // Function to create a connection line with an arrow
  const createConnectionWithArrow = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    key: string,
  ) => {
    // Calculate the angle and distance
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const angle = Math.atan2(dy, dx)

    // Calculate start and end points (adjusted for the node radius)
    const startX = sourceX + nodeRadius * Math.cos(angle)
    const startY = sourceY + nodeRadius * Math.sin(angle)
    const endX = targetX - nodeRadius * Math.cos(angle)
    const endY = targetY - nodeRadius * Math.sin(angle)

    // Arrow properties
    const arrowSize = 8

    // Calculate arrow points
    const arrowPoint1X = endX - arrowSize * Math.cos(angle - Math.PI / 6)
    const arrowPoint1Y = endY - arrowSize * Math.sin(angle - Math.PI / 6)
    const arrowPoint2X = endX - arrowSize * Math.cos(angle + Math.PI / 6)
    const arrowPoint2Y = endY - arrowSize * Math.sin(angle + Math.PI / 6)

    return (
      <g key={key}>
        {/* Main line */}
        <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />

        {/* Arrow head */}
        <line x1={arrowPoint1X} y1={arrowPoint1Y} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />
        <line x1={arrowPoint2X} y1={arrowPoint2Y} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />
      </g>
    )
  }

  // Generate nodes and connections
  const nodes = []
  const connections = []

  // Create nodes
  for (let level = 0; level < diagram.levels; level++) {
    const nodesInLevel = diagram.nodesPerLevel[level] || 0
    const nodeColor = levelColors[level % levelColors.length]
    const strokeColor = level === 0 ? "#1e40af" : level === diagram.levels - 1 ? "#991b1b" : "#374151"

    for (let i = 0; i < nodesInLevel; i++) {
      const { x, y } = getNodePosition(level, i, nodesInLevel)
      const taskId = `L${level + 1}-${i + 1}`

      nodes.push(
        <g key={`node-${level}-${i}`}>
          <circle cx={x} cy={y} r={nodeRadius} fill={nodeColor} stroke={strokeColor} strokeWidth="2" />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold">
            {taskId}
          </text>
        </g>,
      )
    }
  }

  // Create connections
  diagram.connections.forEach(([fromLevel, fromIndex, toLevel, toIndex], idx) => {
    const fromNodesInLevel = diagram.nodesPerLevel[fromLevel] || 0
    const toNodesInLevel = diagram.nodesPerLevel[toLevel] || 0

    const source = getNodePosition(fromLevel, fromIndex, fromNodesInLevel)
    const target = getNodePosition(toLevel, toIndex, toNodesInLevel)

    connections.push(createConnectionWithArrow(source.x, source.y, target.x, target.y, `conn-${idx}`))
  })

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4 overflow-x-auto bg-white">
        <svg width={width} height={height} className="mx-auto">
          {/* Draw connections first so they appear behind nodes */}
          {connections}
          {/* Then draw nodes */}
          {nodes}

          {/* Level labels */}
          {Array.from({ length: diagram.levels }).map((_, level) => (
            <g key={`level-${level}`}>
              <text
                x="20"
                y={50 + level * levelHeight}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#374151"
                fontSize="12"
                fontWeight="bold"
              >
                L{level + 1}
              </text>

              {/* Color indicator */}
              <circle cx="20" cy={70 + level * levelHeight} r="6" fill={levelColors[level % levelColors.length]} />
            </g>
          ))}
        </svg>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Workflow Structure:</strong> {diagram.description}
        </p>
      </div>

      {/* Add a legend for the levels */}
      <div className="flex flex-wrap gap-3 mt-2">
        {Array.from({ length: diagram.levels }).map((_, level) => (
          <div key={`legend-${level}`} className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-1"
              style={{ backgroundColor: levelColors[level % levelColors.length] }}
            ></div>
            <span className="text-xs">Level {level + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
