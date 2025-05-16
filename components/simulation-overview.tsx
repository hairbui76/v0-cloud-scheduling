"use client"

import { Clock } from "lucide-react"

interface SimulationOverviewProps {
  simulationTime: number
  deadline: number
  isRunning: boolean
}

export default function SimulationOverview({ simulationTime, deadline, isRunning }: SimulationOverviewProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        <span>Simulation Time: {simulationTime.toFixed(1)}s</span>
        {isRunning && <span className="ml-2 text-green-500 animate-pulse">●</span>}
      </div>
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-red-500" />
        <span>Deadline: {deadline.toFixed(1)}s</span>
      </div>
    </div>
  )
}
