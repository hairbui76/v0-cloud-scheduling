"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { SimulationResult } from "@/context/simulation-context"
import { algorithmData, algorithmDescriptions } from "@/lib/algorithm-data"

export default function AlgorithmComparison({
  workflowType = "sample",
  simulationResults = [],
}: {
  workflowType: string
  simulationResults: SimulationResult[]
}) {
  // Use simulation results if available, otherwise fall back to static data
  const hasResults = simulationResults.length > 0

  // Add a safety check to ensure the workflow type exists in our data
  const safeWorkflowType = algorithmData[workflowType] ? workflowType : "sample"
  const staticData = algorithmData[safeWorkflowType]

  // Process simulation results into chart data format
  const processedData = hasResults ? processSimulationResults(simulationResults) : staticData

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="success" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="success">Deadline Success Rate</TabsTrigger>
              <TabsTrigger value="cost">Execution Cost</TabsTrigger>
              <TabsTrigger value="vms">VM Utilization</TabsTrigger>
            </TabsList>

            <TabsContent value="success" className="pt-4">
              <h3 className="text-lg font-medium mb-4">Deadline Success Rate (%)</h3>
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
                  <BarChart data={processedData.deadlineSuccess}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="factor"
                      label={{ value: "Deadline Factor", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis label={{ value: "Success Rate (%)", angle: -90, position: "insideLeft" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="DSAWS" name="DSAWS" fill="var(--color-DSAWS)" />
                    <Bar dataKey="CGA" name="CGA" fill="var(--color-CGA)" />
                    <Bar dataKey="Dyna" name="Dyna" fill="var(--color-Dyna)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="text-sm text-muted-foreground mt-4">
                {hasResults
                  ? "This chart shows the actual deadline success rates from your simulations."
                  : "This chart shows the percentage of successful executions that meet the deadline for each algorithm across different deadline factors. A deadline factor of 1.0 represents the strictest deadline (equal to the maximum rank value), while higher factors represent more relaxed deadlines."}
              </p>
            </TabsContent>

            <TabsContent value="cost" className="pt-4">
              <h3 className="text-lg font-medium mb-4">Execution Cost ($)</h3>
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
                  <BarChart data={processedData.executionCost}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="factor"
                      label={{ value: "Deadline Factor", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis label={{ value: "Execution Cost ($)", angle: -90, position: "insideLeft" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="DSAWS" name="DSAWS" fill="var(--color-DSAWS)" />
                    <Bar dataKey="CGA" name="CGA" fill="var(--color-CGA)" />
                    <Bar dataKey="Dyna" name="Dyna" fill="var(--color-Dyna)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="text-sm text-muted-foreground mt-4">
                {hasResults
                  ? "This chart shows the actual execution costs from your simulations."
                  : "This chart shows the total execution cost for each algorithm across different deadline factors. As the deadline becomes more relaxed (higher factor), algorithms can use cheaper resources, resulting in lower costs. DSAWS consistently achieves the lowest cost while still meeting deadlines."}
              </p>
            </TabsContent>

            <TabsContent value="vms" className="pt-4">
              <h3 className="text-lg font-medium mb-4">VM Utilization Over Time</h3>
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
                  <LineChart data={processedData.vmUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      label={{ value: "Simulation Time (seconds)", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis label={{ value: "Number of VMs", angle: -90, position: "insideLeft" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="DSAWS" name="DSAWS" stroke="var(--color-DSAWS)" strokeWidth={2} />
                    <Line type="monotone" dataKey="CGA" name="CGA" stroke="var(--color-CGA)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Dyna" name="Dyna" stroke="var(--color-Dyna)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="text-sm text-muted-foreground mt-4">
                {hasResults
                  ? "This chart shows the actual VM utilization over time from your simulations."
                  : "This chart shows the number of VMs used by each algorithm over the course of the workflow execution. DSAWS typically uses fewer VMs by efficiently scheduling tasks on existing resources and minimizing data transfer costs. CGA and Dyna tend to provision more VMs, especially during peak execution periods."}
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Algorithm Comparison</h3>

          <Tabs defaultValue="DSAWS" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="DSAWS">DSAWS</TabsTrigger>
              <TabsTrigger value="CGA">CGA</TabsTrigger>
              <TabsTrigger value="Dyna">Dyna</TabsTrigger>
            </TabsList>

            {Object.entries(algorithmDescriptions).map(([key, algo]) => (
              <TabsContent key={key} value={key} className="pt-4">
                <h4 className="text-md font-medium mb-2">{algo.name}</h4>
                <p className="text-sm mb-4">{algo.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Strengths</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {algo.strengths.map((strength, index) => (
                        <li key={index} className="text-sm">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Weaknesses</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {algo.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm">
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to process simulation results into chart data
function processSimulationResults(results: SimulationResult[]) {
  // Group results by deadline factor
  const factorGroups = results.reduce(
    (acc, result) => {
      const factor = result.deadlineFactor.toFixed(1)
      if (!acc[factor]) {
        acc[factor] = []
      }
      acc[factor].push(result)
      return acc
    },
    {} as Record<string, SimulationResult[]>,
  )

  // Create deadline success data
  const deadlineSuccess = Object.entries(factorGroups).map(([factor, results]) => {
    const data: any = { factor }

    // Calculate success rate for each algorithm
    ;["DSAWS", "CGA", "Dyna"].forEach((algo) => {
      const algoResults = results.filter((r) => r.algorithm === algo)
      if (algoResults.length > 0) {
        const successCount = algoResults.filter((r) => r.meetsDeadline).length
        data[algo] = (successCount / algoResults.length) * 100
      } else {
        data[algo] = 0
      }
    })

    return data
  })

  // Create execution cost data
  const executionCost = Object.entries(factorGroups).map(([factor, results]) => {
    const data: any = { factor }

    // Get average cost for each algorithm
    ;["DSAWS", "CGA", "Dyna"].forEach((algo) => {
      const algoResults = results.filter((r) => r.algorithm === algo)
      if (algoResults.length > 0) {
        const avgCost = algoResults.reduce((sum, r) => sum + r.cost, 0) / algoResults.length
        data[algo] = avgCost
      } else {
        data[algo] = 0
      }
    })

    return data
  })

  // Create VM utilization data
  // First, find the maximum simulation time
  const maxTime = Math.max(...results.map((r) => r.completionTime))

  // Create time points (10 points from 0 to maxTime)
  const timePoints = Array.from({ length: 10 }, (_, i) => Math.floor((i * maxTime) / 9))

  // Create VM utilization data
  const vmUtilization = timePoints.map((time) => {
    const data: any = { time }

    // Get VM count at this time point for each algorithm
    ;["DSAWS", "CGA", "Dyna"].forEach((algo) => {
      const algoResults = results.filter((r) => r.algorithm === algo)
      if (algoResults.length > 0) {
        // Find the closest time point in each result's vmUtilization data
        const vmCounts = algoResults.map((r) => {
          const utilData = r.vmUtilization
          if (!utilData || utilData.length === 0) return 0

          // Find the closest time point
          const closest = utilData.reduce((prev, curr) => {
            return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev
          })

          return closest.vms
        })

        // Average the VM counts
        data[algo] = vmCounts.reduce((sum, count) => sum + count, 0) / vmCounts.length
      } else {
        data[algo] = 0
      }
    })

    return data
  })

  return {
    deadlineSuccess,
    executionCost,
    vmUtilization,
  }
}
