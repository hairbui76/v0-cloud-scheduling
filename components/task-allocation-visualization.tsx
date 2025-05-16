"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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

type Task = {
  id: string
  name: string
  runtime: number
  dependencies: string[]
  rank: number
  completed: boolean
  startTime?: number
  endTime?: number
  assignedVM?: string
  level: number
}

export default function TaskAllocationVisualization({
  vms,
  tasks,
  algorithm,
}: { vms: VM[]; tasks: Task[]; algorithm: string }) {
  // Group tasks by VM type
  const vmTypeGroups: Record<string, { type: string; count: number; speed: number; cost: number }> = {}

  // Count tasks for each VM type
  vms.forEach((vm) => {
    if (!vmTypeGroups[vm.type]) {
      vmTypeGroups[vm.type] = {
        type: vm.type,
        count: 0,
        speed: vm.speed,
        cost: vm.cost,
      }
    }
    vmTypeGroups[vm.type].count += vm.tasks.length
  })

  // Convert to array for chart
  const chartData = Object.values(vmTypeGroups).sort((a, b) => a.speed - b.speed)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{algorithm} Task Allocation by VM Type</h3>
      <div>
        <h4 className="text-md font-medium mb-2">Task Count by VM Type</h4>
        <ChartContainer
          config={{
            count: {
              label: "Task Count",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="count" name="Task Count" fill="var(--color-count)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">VM Type Characteristics</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VM Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed (GCEU)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost ($/min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((item) => (
                <tr key={item.type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.speed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.cost.toFixed(5)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
