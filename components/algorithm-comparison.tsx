"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { SimulationResult } from "@/context/simulation-context"

// Static algorithm comparison data (fallback when no simulation results are available)
const algorithmData = {
  montage: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 100 },
      { factor: "1.5", DSAWS: 100, CGA: 100, Dyna: 100 },
      { factor: "2.0", DSAWS: 100, CGA: 100, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 0.12, CGA: 0.18, Dyna: 0.25 },
      { factor: "1.5", DSAWS: 0.08, CGA: 0.12, Dyna: 0.18 },
      { factor: "2.0", DSAWS: 0.06, CGA: 0.09, Dyna: 0.15 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 2, CGA: 3, Dyna: 2 },
      { time: "25", DSAWS: 3, CGA: 5, Dyna: 4 },
      { time: "50", DSAWS: 3, CGA: 6, Dyna: 5 },
      { time: "75", DSAWS: 2, CGA: 6, Dyna: 5 },
      { time: "100", DSAWS: 2, CGA: 4, Dyna: 3 },
      { time: "125", DSAWS: 1, CGA: 3, Dyna: 2 },
      { time: "150", DSAWS: 1, CGA: 2, Dyna: 2 },
      { time: "175", DSAWS: 1, CGA: 1, Dyna: 1 },
    ],
  },
  cybershake: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 0, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 1.2, CGA: 2.1, Dyna: 2.5 },
      { factor: "1.5", DSAWS: 0.8, CGA: 1.5, Dyna: 1.8 },
      { factor: "2.0", DSAWS: 0.6, CGA: 1.2, Dyna: 1.5 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 3, CGA: 4, Dyna: 3 },
      { time: "100", DSAWS: 5, CGA: 8, Dyna: 7 },
      { time: "200", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "300", DSAWS: 10, CGA: 15, Dyna: 12 },
      { time: "400", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "500", DSAWS: 5, CGA: 8, Dyna: 7 },
      { time: "600", DSAWS: 3, CGA: 5, Dyna: 4 },
      { time: "700", DSAWS: 1, CGA: 2, Dyna: 2 },
    ],
  },
  ligo: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 0, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 2.5, CGA: 4.2, Dyna: 5.1 },
      { factor: "1.5", DSAWS: 1.8, CGA: 3.5, Dyna: 4.2 },
      { factor: "2.0", DSAWS: 1.2, CGA: 2.8, Dyna: 3.5 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 4, CGA: 5, Dyna: 4 },
      { time: "100", DSAWS: 6, CGA: 8, Dyna: 7 },
      { time: "200", DSAWS: 8, CGA: 10, Dyna: 9 },
      { time: "300", DSAWS: 8, CGA: 10, Dyna: 9 },
      { time: "400", DSAWS: 6, CGA: 8, Dyna: 7 },
      { time: "500", DSAWS: 4, CGA: 6, Dyna: 5 },
      { time: "600", DSAWS: 2, CGA: 3, Dyna: 3 },
    ],
  },
  epigenomics: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 100, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 80, CGA: 120, Dyna: 140 },
      { factor: "1.5", DSAWS: 60, CGA: 90, Dyna: 110 },
      { factor: "2.0", DSAWS: 40, CGA: 70, Dyna: 90 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 5, CGA: 7, Dyna: 6 },
      { time: "5000", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "10000", DSAWS: 12, CGA: 18, Dyna: 15 },
      { time: "15000", DSAWS: 15, CGA: 22, Dyna: 18 },
      { time: "20000", DSAWS: 12, CGA: 18, Dyna: 15 },
      { time: "25000", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "30000", DSAWS: 3, CGA: 5, Dyna: 4 },
    ],
  },
  sample: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 50, CGA: 25, Dyna: 75 },
      { factor: "1.5", DSAWS: 75, CGA: 50, Dyna: 90 },
      { factor: "2.0", DSAWS: 90, CGA: 75, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 10, CGA: 15, Dyna: 20 },
      { factor: "1.5", DSAWS: 8, CGA: 12, Dyna: 16 },
      { factor: "2.0", DSAWS: 6, CGA: 9, Dyna: 12 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 1, CGA: 2, Dyna: 1 },
      { time: "50", DSAWS: 2, CGA: 3, Dyna: 2 },
      { time: "100", DSAWS: 3, CGA: 4, Dyna: 3 },
    ],
  },
}

// Algorithm descriptions
const algorithmDescriptions = {
  DSAWS: {
    name: "Deadline and Structure-Aware Workflow Scheduler (DSAWS)",
    description:
      "A heuristic algorithm that analyzes workflow structure to determine the type and number of VMs to deploy and when to provision/de-provision them.",
    strengths: [
      "Analyzes workflow structure to make informed scheduling decisions",
      "Considers VM provisioning/de-provisioning delays",
      "Minimizes data transfer by assigning related tasks to the same VM",
      "Uses leftover time in billing periods to avoid wasting resources",
      "Highly effective at meeting deadlines while minimizing costs",
    ],
    weaknesses: [
      "Static scheduling approach may not adapt to unexpected runtime variations",
      "Requires detailed workflow structure analysis upfront",
    ],
  },
  CGA: {
    name: "Coevolutionary Genetic Algorithm (CGA)",
    description:
      "A genetic algorithm that uses adaptive penalty function for strict constraints and adjusts crossover and mutation probability to accelerate convergence.",
    strengths: [
      "Uses adaptive penalty function for handling constraints",
      "Adjusts crossover and mutation probabilities to accelerate convergence",
      "Generates initial population based on critical path",
      "Can find near-optimal solutions for complex scheduling problems",
    ],
    weaknesses: [
      "Computationally intensive, especially for large workflows",
      "May struggle with strict deadline constraints",
      "Doesn't consider VM provisioning/de-provisioning delays",
      "Less effective at minimizing data transfer costs",
    ],
  },
  Dyna: {
    name: "Dyna",
    description:
      "A probabilistic scheduling system that minimizes monetary cost while satisfying probabilistic deadline guarantees.",
    strengths: [
      "Uses A*-based instance configuration for performance dynamics",
      "Hybrid instance configuration refinement for spot instances",
      "Handles cloud performance and price dynamics",
      "Offers probabilistic performance guarantees",
    ],
    weaknesses: [
      "May over-provision resources to ensure deadline compliance",
      "Less effective at minimizing data transfer costs",
      "Complex implementation with multiple optimization steps",
      "May struggle with workflows having extreme runtime variations",
    ],
  },
}

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
