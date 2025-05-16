"use client"

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

type VM = {
  id: string
  type: string
  cost: number
  speed: number
  tasks: string[]
  startTime: number
  endTime?: number
  algorithm: string
  currentTime: number
}

export default function TimelineVisualization({ tasks, vms, currentTime = 0, maxTime = 30 }) {
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

  // Calculate time markers
  const timeMarkers = Array.from({ length: maxTime + 1 }, (_, i) => i)

  return (
    <div className="border rounded-md p-4 overflow-x-auto">
      <svg width="900" height={vms.length * 80 + 60} className="w-full h-auto">
        {/* Time axis */}
        <g transform="translate(80, 0)">
          {timeMarkers.map((time) => {
            const x = (time / maxTime) * 800
            return (
              <g key={`time-${time}`}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={vms.length * 80}
                  stroke={time === 0 ? "#374151" : "#e5e7eb"}
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={vms.length * 80 + 20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#374151"
                  fontSize="12"
                >
                  {time}
                </text>
              </g>
            )
          })}
        </g>

        {/* VM lanes */}
        {vms.map((vm, vmIndex) => (
          <g key={vm.id} transform={`translate(0, ${vmIndex * 80})`}>
            {/* VM label */}
            <text
              x="40"
              y="40"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#374151"
              fontSize="14"
              fontWeight="medium"
            >
              {vm.id}
            </text>

            {/* VM details */}
            <text x="40" y="60" textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10">
              {vm.type}
            </text>

            {/* VM lane background */}
            <rect x="80" y="10" width="800" height="60" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />

            {/* Task bars */}
            {tasks
              .filter((task) => task.assignedVM === vm.id)
              .map((task) => {
                const startX = 80 + ((task.startTime || 0) / maxTime) * 800
                const width = (task.runtime / maxTime) * 800
                return (
                  <g key={task.id}>
                    <rect
                      x={startX}
                      y="15"
                      width={width}
                      height="50"
                      fill={getTaskColor(task)}
                      stroke="#374151"
                      strokeWidth="1"
                      rx="4"
                      ry="4"
                    />
                    <text
                      x={startX + width / 2}
                      y="40"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {task.id}
                    </text>

                    {/* Task runtime */}
                    {width > 40 && (
                      <text
                        x={startX + width / 2}
                        y="55"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="10"
                      >
                        {task.runtime}s
                      </text>
                    )}
                  </g>
                )
              })}
          </g>
        ))}

        {/* Current time indicator */}
        <line
          x1={80 + (currentTime / maxTime) * 800}
          y1="0"
          x2={80 + (currentTime / maxTime) * 800}
          y2={vms.length * 80}
          stroke="#ef4444" // red-500
          strokeWidth="2"
        />
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-gray-300 mr-2"></div>
          <span className="text-xs">Waiting</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
          <span className="text-xs">Running</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
          <span className="text-xs">Completed</span>
        </div>
      </div>
    </div>
  )
}
