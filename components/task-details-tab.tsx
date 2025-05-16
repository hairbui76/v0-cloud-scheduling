"use client"

import { CustomBadge } from "@/components/ui/custom-badge"
import type { Task } from "@/types/simulation"

interface TaskDetailsTabProps {
  tasks: Task[]
  simulationTime: number
}

export default function TaskDetailsTab({ tasks, simulationTime }: TaskDetailsTabProps) {
  // Helper function to determine task status
  const getTaskStatus = (task: Task) => {
    if (task.completed) {
      return "completed"
    } else if (simulationTime >= (task.startTime || 0)) {
      return "running"
    } else {
      return "waiting"
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">DSAWS Task Details</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Runtime
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks
              .sort((a, b) => b.rank - a.rank) // Sort by rank (highest first)
              .map((task) => {
                const status = getTaskStatus(task)
                return (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.runtime}s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedVM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.startTime}s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.endTime}s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {status === "completed" ? (
                        <CustomBadge variant="success">Completed</CustomBadge>
                      ) : status === "running" ? (
                        <CustomBadge variant="default">Running</CustomBadge>
                      ) : (
                        <CustomBadge variant="outline">Waiting</CustomBadge>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
