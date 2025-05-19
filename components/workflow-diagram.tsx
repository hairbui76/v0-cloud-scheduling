"use client"

import { useEffect, useState } from "react"

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
}

type NodePosition = {
  x: number
  y: number
}

export default function WorkflowDiagram({ tasks, currentTime = 0 }) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})

  useEffect(() => {
    // Calculate positions for each task
    const newPositions: Record<string, NodePosition> = {}
    const levelCounts: Record<number, number> = {}
    const levelCurrentCounts: Record<number, number> = {}

    // Count tasks per level
    tasks.forEach((task) => {
      levelCounts[task.level] = (levelCounts[task.level] || 0) + 1
    })

    // Calculate positions
    tasks.forEach((task) => {
      const level = task.level
      levelCurrentCounts[level] = (levelCurrentCounts[level] || 0) + 1

      // Calculate horizontal position based on level count
      const xSpacing = 800 / (levelCounts[level] + 1)
      const x = xSpacing * levelCurrentCounts[level]

      // Calculate vertical position based on level
      // Increase vertical spacing between levels
      const y = 150 * level

      newPositions[task.id] = { x, y }
    })

    setPositions(newPositions)
  }, [tasks])

  // Get task status based on current time
  const getTaskStatus = (task: Task) => {
    if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY)) {
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

  // Function to create a connection line with an arrow
  const createConnectionWithArrow = (sourceX, sourceY, targetX, targetY) => {
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
      <>
        {/* Main line */}
        <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />

        {/* Arrow head */}
        <line x1={arrowPoint1X} y1={arrowPoint1Y} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />
        <line x1={arrowPoint2X} y1={arrowPoint2Y} x2={endX} y2={endY} stroke="#666666" strokeWidth="2" />
      </>
    )
  }

  return (
    <div className="border rounded-md p-4 overflow-x-auto">
      <svg width="900" height="650" className="w-full h-auto">
        {/* Draw connections with arrows */}
        {tasks.map((task) =>
          task.dependencies.map((depId) => {
            const sourcePos = positions[depId]
            const targetPos = positions[task.id]

            if (!sourcePos || !targetPos) return null

            return (
              <g key={`${depId}-${task.id}`}>
                {createConnectionWithArrow(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y)}
              </g>
            )
          }),
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
                fontSize="16"
                fontWeight="bold"
              >
                {task.id}
              </text>

              {/* Task details - positioned below the circle with more spacing */}
              <text x={pos.x} y={pos.y + 50} textAnchor="middle" dominantBaseline="middle" fill="#374151" fontSize="12">
                Rank: {task.rank}
              </text>

              <text x={pos.x} y={pos.y + 70} textAnchor="middle" dominantBaseline="middle" fill="#374151" fontSize="12">
                Time: {task.runtime}s
              </text>

              <text x={pos.x} y={pos.y + 90} textAnchor="middle" dominantBaseline="middle" fill="#374151" fontSize="12">
                VM: {task.assignedVM}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-xs">Waiting</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-xs">Running</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-xs">Completed</span>
        </div>
      </div>
    </div>
  )
}
