"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Server, DollarSign } from "lucide-react"
import type { VM } from "@/types/simulation"
import { CustomBadge } from "@/components/ui/custom-badge"

interface SimulationVMDetailsProps {
  algorithm: string
  progress: number
  vms: VM[]
  cost: number
  meetsDeadline: boolean
  simulationTime: number
}

export default function SimulationVMDetails({
  algorithm,
  progress,
  vms,
  cost,
  meetsDeadline,
  simulationTime,
}: SimulationVMDetailsProps) {
  // Helper function to get task status badge variant
  const getTaskStatusBadge = (taskId: string, vm: VM) => {
    // Find the task in the VM's task list
    const taskIndex = vm.tasks.indexOf(taskId)
    if (taskIndex === -1) return "outline"

    // For the sample workflow, we need to respect the predefined start and end times
    // These are hardcoded values from the DSAWS paper example
    const taskTimes = {
      // DSAWS VM1 tasks
      t2: { start: 2, end: 6 },
      t5: { start: 6, end: 15 },
      t8: { start: 15, end: 29 },
      // DSAWS VM2 tasks
      t1: { start: 2, end: 7 },
      t4: { start: 7, end: 15 },
      t7: { start: 15, end: 25 },
      // DSAWS VM3 tasks
      t3: { start: 2, end: 8 },
      t6: { start: 8, end: 13 },
      t9: { start: 13, end: 27 },
      // Default values for other tasks
      default: { start: 0, end: 10 },
    }

    // Get the task times (use default if not found)
    const times = taskTimes[taskId] || taskTimes.default

    // Determine status based on simulation time and task times
    if (simulationTime >= times.end) {
      return "success" // Completed
    } else if (simulationTime >= times.start) {
      return "default" // Running
    } else {
      return "outline" // Waiting
    }
  }

  // Get background color based on algorithm
  const getBgColor = () => {
    switch (algorithm) {
      case "DSAWS":
        return "bg-blue-50"
      case "CGA":
        return "bg-green-50"
      case "Dyna":
        return "bg-purple-50"
      default:
        return "bg-gray-50"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getBgColor()}>
            {algorithm}
          </Badge>
          <span className="text-sm">{progress.toFixed(2)}% Complete</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Server className="h-4 w-4" />
            <span className="text-sm">{vms.length} VMs</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">${cost.toFixed(4)}</span>
          </div>
          <CustomBadge variant={meetsDeadline ? "success" : "destructive"}>
            {meetsDeadline ? "Meets Deadline" : "Misses Deadline"}
          </CustomBadge>
        </div>
      </div>
      <Progress value={progress} className="h-2" />

      {/* VM Details Section */}
      <div className="mt-4">
        <h3 className="text-md font-medium mb-2">{algorithm} VM Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vms.map((vm) => (
            <div key={vm.id} className={`border rounded-md p-4 ${getBgColor()}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-lg">{vm.id}</div>
                <Badge variant="outline">{vm.type}</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Speed:</span>
                  <span>{vm.speed} GCEU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost:</span>
                  <span>${vm.cost}/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Time:</span>
                  <span>{vm.currentTime?.toFixed(1) || simulationTime.toFixed(1)}s</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500">Assigned Tasks:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vm.tasks.map((taskId) => (
                      <CustomBadge key={taskId} variant={getTaskStatusBadge(taskId, vm) as any} className="text-xs">
                        {taskId}
                      </CustomBadge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
