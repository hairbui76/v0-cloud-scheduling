"use client"

import { useEffect, useState, useMemo } from "react"

type Task = {
  id: string
  name: string
  runtime: number
  dependencies: string[]
  rank: number
  level: number
  startTime?: number
  endTime?: number
  assignedVM?: string
  completed?: boolean
}

type NodePosition = {
  x: number
  y: number
}

export default function WorkflowDiagram({ tasks = [], currentTime = 0 }) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})

  // Calculate positions once when tasks change
  useEffect(() => {
    if (!tasks || tasks.length === 0) return

    // Calculate positions for each task using a more robust algorithm
    const newPositions: Record<string, NodePosition> = {}
    const levelCounts: Record<number, number> = {}
    const levelCurrentCounts: Record<number, number> = {}

    // Count tasks per level
    tasks.forEach((task) => {
      const level = task.level || 1
      levelCounts[level] = (levelCounts[level] || 0) + 1
    })

    // Sort tasks by level and then by rank (higher rank first)
    const sortedTasks = [...tasks].sort((a, b) => {
      if ((a.level || 1) !== (b.level || 1)) {
        return (a.level || 1) - (b.level || 1)
      }
      return (b.rank || 0) - (a.rank || 0)
    })

    // Calculate positions
    sortedTasks.forEach((task) => {
      const level = task.level || 1
      levelCurrentCounts[level] = (levelCurrentCounts[level] || 0) + 1

      // Calculate horizontal position based on level count
      const xSpacing = 800 / (levelCounts[level] + 1)
      const x = xSpacing * levelCurrentCounts[level]

      // Calculate vertical position based on level
      // Increase vertical spacing between levels
      const y = 120 * level

      newPositions[task.id] = { x, y }
    })

    setPositions(newPositions)
  }, [tasks])

  // Get task status based on current time
  const getTaskStatus = (task: Task) => {
    if (task.completed || currentTime >= (task.endTime || Number.POSITIVE_INFINITY)) {
      return "completed"
    } else if (currentTime >= (task.startTime || 0)) {
      return "running"
    } else {
      return "waiting"
    }
  }

  // Get color based on task status
  const getTaskColor = (task: Task) => {
    const status = getTaskStatus(task)
    switch (status) {
      case "completed":
        return "#4ade80" // green-500
      case "running":
        return "#3b82f6" // blue-500
      case "waiting":
        return "#d1d5db" // gray-300
      default:
        return "#d1d5db"
    }
  }

  // Memoize connections to avoid recalculating on every render
  const connections = useMemo(() => {
    if (!tasks || tasks.length === 0 || Object.keys(positions).length === 0) return []

    const result = []

    tasks.forEach((task) => {
      if (!task.dependencies) return

      task.dependencies.forEach((depId) => {
        const sourcePos = positions[depId]
        const targetPos = positions[task.id]

        if (!sourcePos || !targetPos) return

        result.push({
          id: `${depId}-${task.id}`,
          source: sourcePos,
          target: targetPos,
          sourceId: depId,
          targetId: task.id,
        })
      })
    })

    return result
  }, [tasks, positions])

  // Function to create a connection line with an arrow
  const createConnectionWithArrow = (sourceX, sourceY, targetX, targetY, key) => {
    // Calculate the angle and distance
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const angle = Math.atan2(dy, dx)

    // Node radius
    const radius = 30

    // Calculate start and end points (adjusted for the node radius)
    const startX = sourceX + radius * Math.cos(angle)
    const startY = sourceY + radius * Math.sin(angle)
    const endX = targetX - radius * Math.cos(angle)
    const endY = targetY - radius * Math.sin(angle)

    // Arrow properties
    const arrowSize = 10

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

  // If no tasks or positions, show a placeholder
  if (!tasks || tasks.length === 0 || Object.keys(positions).length === 0) {
    return (
      <div className="border rounded-md p-4 flex items-center justify-center h-[400px] bg-gray-50">
        <p className="text-gray-500">No workflow data available to display</p>
      </div>
    )
  }

  // Calculate SVG dimensions based on task positions
  const maxX = Math.max(...Object.values(positions).map((pos) => pos.x)) + 100
  const maxY = Math.max(...Object.values(positions).map((pos) => pos.y)) + 150
  const svgWidth = Math.max(800, maxX)
  const svgHeight = Math.max(400, maxY)

  return (
    <div className="border rounded-md p-4 overflow-x-auto bg-white">
      <svg width={svgWidth} height={svgHeight} className="mx-auto">
        {/* Draw connections with arrows */}
        {connections.map((conn) =>
          createConnectionWithArrow(conn.source.x, conn.source.y, conn.target.x, conn.target.y, conn.id),
        )}

        {/* Draw nodes (tasks) */}
        {tasks.map((task) => {
          const pos = positions[task.id]
          if (!pos) return null

          return (
            <g key={task.id}>
              {/* Task circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="30"
                fill={getTaskColor(task)}
                stroke="#374151" // gray-700
                strokeWidth="2"
              />

              {/* Task ID */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="14"
                fontWeight="bold"
              >
                {task.id}
              </text>

              {/* Task details - positioned below the circle with more spacing */}
              <g className="task-details">
                <text
                  x={pos.x}
                  y={pos.y + 50}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#374151"
                  fontSize="12"
                >
                  Rank: {task.rank}
                </text>

                <text
                  x={pos.x}
                  y={pos.y + 70}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#374151"
                  fontSize="12"
                >
                  Time: {task.runtime}s
                </text>

                <text
                  x={pos.x}
                  y={pos.y + 90}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#374151"
                  fontSize="12"
                >
                  VM: {task.assignedVM || "N/A"}
                </text>
              </g>
            </g>
          )
        })}

        {/* Current time indicator */}
        {currentTime > 0 && (
          <line
            x1={0}
            y1={svgHeight - 30}
            x2={svgWidth}
            y2={svgHeight - 30}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
        {currentTime > 0 && (
          <text x={10} y={svgHeight - 10} fill="#ef4444" fontSize="12" fontWeight="bold">
            Current Time: {currentTime.toFixed(1)}s
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-sm">Waiting</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">Running</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm">Completed</span>
        </div>
      </div>
    </div>
  )
}
