"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Workflow data
const workflowData = {
  montage: {
    name: "Montage",
    description: "Astronomy workflow that creates image mosaics of the sky",
    tasks: 1000,
    levels: 9,
    dependencies: 4485,
    meanRuntime: 11.37,
    meanDataSize: 3.21,
    maxRank: 369,
    structure: "Many levels with a mix of serial and parallel tasks",
    characteristics: [
      "Several levels have single-threaded tasks that must execute serially",
      "Keeping one VM active during these periods reduces cost without affecting the deadline",
      "For 9-level Montage workflows, approximately 6 levels are controlled by serial tasks",
    ],
    levelDistribution: [
      { level: "Level 1", tasks: 210, runtime: 42 },
      { level: "Level 2", tasks: 210, runtime: 38 },
      { level: "Level 3", tasks: 209, runtime: 75 },
      { level: "Level 4", tasks: 209, runtime: 67 },
      { level: "Level 5", tasks: 1, runtime: 15 },
      { level: "Level 6", tasks: 1, runtime: 25 },
      { level: "Level 7", tasks: 1, runtime: 30 },
      { level: "Level 8", tasks: 158, runtime: 65 },
      { level: "Level 9", tasks: 1, runtime: 12 },
    ],
  },
  cybershake: {
    name: "CyberShake",
    description: "Earthquake science workflow for seismic hazard analysis",
    tasks: 1000,
    levels: 5,
    dependencies: 3988,
    meanRuntime: 22.75,
    meanDataSize: 102.29,
    maxRank: 736,
    structure: "Intense parallelism in middle levels",
    characteristics: [
      "Levels 2 and 3 contain nearly 99% of all tasks (994 out of 1000)",
      "These levels have high concurrency and large data transfers",
      "DSAWS minimizes data transfer by assigning related tasks to the same VM",
      "This reduces both execution time and cost compared to algorithms that spread tasks across many VMs",
    ],
    levelDistribution: [
      { level: "Level 1", tasks: 5, runtime: 25 },
      { level: "Level 2", tasks: 497, runtime: 702 },
      { level: "Level 3", tasks: 497, runtime: 650 },
      { level: "Level 4", tasks: 0, runtime: 0 },
      { level: "Level 5", tasks: 1, runtime: 10 },
    ],
  },
  ligo: {
    name: "LIGO (Inspiral)",
    description: "Gravitational physics workflow for detecting gravitational waves",
    tasks: 1000,
    levels: 6,
    dependencies: 3246,
    meanRuntime: 227.78,
    meanDataSize: 8.9,
    maxRank: 625,
    structure: "Many CPU-intensive tasks with large runtime variations",
    characteristics: [
      "Task runtimes can vary by a factor of 3 compared to the mean",
      "DSAWS assigns appropriate VM types based on task computational requirements",
      "This prevents bottlenecks caused by long-running tasks on slower VMs",
    ],
    levelDistribution: [
      { level: "Level 1", tasks: 200, runtime: 150 },
      { level: "Level 2", tasks: 200, runtime: 180 },
      { level: "Level 3", tasks: 200, runtime: 220 },
      { level: "Level 4", tasks: 200, runtime: 250 },
      { level: "Level 5", tasks: 199, runtime: 300 },
      { level: "Level 6", tasks: 1, runtime: 15 },
    ],
  },
  epigenomics: {
    name: "Epigenomics",
    description: "Biology workflow for genome sequence processing",
    tasks: 997,
    levels: 8,
    dependencies: 3228,
    meanRuntime: 3866.4,
    meanDataSize: 388.59,
    maxRank: 27232,
    structure: "Extreme runtime variations",
    characteristics: [
      "Task runtimes can vary by factors of 7,000 or more",
      "Level 5 contains 245 tasks that account for 99.8% of total execution time",
      "DSAWS allocates resources primarily to this critical level",
      "This balanced approach ensures deadline compliance while minimizing costs",
    ],
    levelDistribution: [
      { level: "Level 1", tasks: 7, runtime: 2584 },
      { level: "Level 2", tasks: 8, runtime: 3200 },
      { level: "Level 3", tasks: 8, runtime: 3500 },
      { level: "Level 4", tasks: 8, runtime: 3800 },
      { level: "Level 5", tasks: 245, runtime: 27000 },
      { level: "Level 6", tasks: 245, runtime: 4500 },
      { level: "Level 7", tasks: 475, runtime: 5200 },
      { level: "Level 8", tasks: 1, runtime: 120 },
    ],
  },
  sample: {
    name: "Sample Workflow",
    description: "Example workflow from the DSAWS paper with 9 tasks",
    tasks: 9,
    levels: 3,
    dependencies: 6,
    meanRuntime: 8.33,
    meanDataSize: 2.5,
    maxRank: 32,
    structure: "Simple three-level workflow with predefined task assignments",
    characteristics: [
      "Tasks are ranked based on their runtime and dependencies",
      "Higher rank values indicate higher priority for scheduling",
      "Tasks are assigned to VMs based on their rank and dependencies",
      "The workflow is designed to demonstrate the DSAWS algorithm's effectiveness",
    ],
    levelDistribution: [
      { level: "Level 1", tasks: 3, runtime: 15 },
      { level: "Level 2", tasks: 3, runtime: 22 },
      { level: "Level 3", tasks: 3, runtime: 38 },
    ],
  },
}

export default function WorkflowData({ workflowType }) {
  // Check if workflowType is valid and exists in workflowData
  if (!workflowType || !workflowData[workflowType]) {
    // Provide a default workflow or show an error message
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-800">
        <h3 className="text-lg font-medium mb-2">Invalid Workflow Type</h3>
        <p>The specified workflow type "{workflowType}" is not available. Please select a valid workflow.</p>
      </div>
    )
  }

  const workflow = workflowData[workflowType]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{workflow.name} Workflow</h3>
              <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>

              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Tasks</TableCell>
                    <TableCell>{workflow.tasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Levels</TableCell>
                    <TableCell>{workflow.levels}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Dependencies</TableCell>
                    <TableCell>{workflow.dependencies}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mean Runtime</TableCell>
                    <TableCell>{workflow.meanRuntime} seconds</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mean Data Size</TableCell>
                    <TableCell>{workflow.meanDataSize} MB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Maximum Rank</TableCell>
                    <TableCell>{workflow.maxRank} seconds</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Structure</TableCell>
                    <TableCell>{workflow.structure}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Key Characteristics</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {workflow.characteristics.map((char, index) => (
                  <li key={index} className="text-sm">
                    {char}
                  </li>
                ))}
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Task Distribution by Level</h3>
              <ChartContainer
                config={{
                  tasks: {
                    label: "Number of Tasks",
                    color: "hsl(var(--chart-1))",
                  },
                  runtime: {
                    label: "Runtime (seconds)",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workflow.levelDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tasks" name="Number of Tasks" fill="var(--color-tasks)" />
                    <Bar yAxisId="right" dataKey="runtime" name="Runtime (seconds)" fill="var(--color-runtime)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
