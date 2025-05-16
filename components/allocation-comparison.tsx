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

export default function AllocationComparison({
  dsawsVMs,
  cgaVMs,
  dynaVMs,
  dsawsTasks,
  cgaTasks,
  dynaTasks,
}: {
  dsawsVMs: VM[]
  cgaVMs: VM[]
  dynaVMs: VM[]
  dsawsTasks: Task[]
  cgaTasks: Task[]
  dynaTasks: Task[]
}) {
  // Function to process VM data for a specific algorithm
  const processVMData = (vms: VM[], tasks: Task[]) => {
    const vmTypeGroups: Record<string, { count: number }> = {}

    // Count tasks for each VM type
    vms.forEach((vm) => {
      if (!vmTypeGroups[vm.type]) {
        vmTypeGroups[vm.type] = { count: 0 }
      }
      vmTypeGroups[vm.type].count += vm.tasks.length
    })

    return vmTypeGroups
  }

  // Get data for each algorithm
  const dsawsData = processVMData(dsawsVMs, dsawsTasks)
  const cgaData = processVMData(cgaVMs, cgaTasks)
  const dynaData = processVMData(dynaVMs, dynaTasks)

  // Get all unique VM types
  const allVMTypes = new Set([...Object.keys(dsawsData), ...Object.keys(cgaData), ...Object.keys(dynaData)])

  // Create comparison data
  const comparisonData = Array.from(allVMTypes)
    .map((vmType) => ({
      vmType,
      DSAWS: dsawsData[vmType]?.count || 0,
      CGA: cgaData[vmType]?.count || 0,
      Dyna: dynaData[vmType]?.count || 0,
    }))
    .sort((a, b) => {
      // Sort by VM type (extract the number from n1-standard-X)
      const aNum = Number.parseInt(a.vmType.split("-")[2], 10)
      const bNum = Number.parseInt(b.vmType.split("-")[2], 10)
      return aNum - bNum
    })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Task Allocation Comparison</h3>
      <p className="text-sm text-gray-600">
        This chart compares how each algorithm distributes tasks across different VM types. DSAWS tends to be more
        strategic, CGA more uniform, and Dyna more probabilistic.
      </p>

      <ChartContainer
        config={{
          DSAWS: {
            label: "DSAWS",
            color: "hsl(var(--chart-1))",
          },
          CGA: {
            label: "CGA",
            color: "hsl(var(--chart-2))",
          },
          Dyna: {
            label: "Dyna",
            color: "hsl(var(--chart-3))",
          },
        }}
        className="h-[400px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vmType" />
            <YAxis label={{ value: "Number of Tasks", angle: -90, position: "insideLeft" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="DSAWS" name="DSAWS" fill="var(--color-DSAWS)" />
            <Bar dataKey="CGA" name="CGA" fill="var(--color-CGA)" />
            <Bar dataKey="Dyna" name="Dyna" fill="var(--color-Dyna)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md bg-blue-50">
          <h4 className="font-medium mb-2">DSAWS Strategy</h4>
          <p className="text-sm">
            DSAWS uses a structure-aware approach, allocating faster VMs to critical tasks with higher rank values. This
            strategic allocation helps meet deadlines while minimizing costs.
          </p>
        </div>
        <div className="p-4 border rounded-md bg-green-50">
          <h4 className="font-medium mb-2">CGA Strategy</h4>
          <p className="text-sm">
            CGA uses a more uniform distribution of VM types, exploring a wider solution space through its genetic
            algorithm approach. This can lead to higher costs but potentially better performance.
          </p>
        </div>
        <div className="p-4 border rounded-md bg-purple-50">
          <h4 className="font-medium mb-2">Dyna Strategy</h4>
          <p className="text-sm">
            Dyna uses a probabilistic approach, favoring cost-effective VMs with occasional faster ones. This balances
            performance and cost, but may struggle with strict deadlines.
          </p>
        </div>
      </div>
    </div>
  )
}
