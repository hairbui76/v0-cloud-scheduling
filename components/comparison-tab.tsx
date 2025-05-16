"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import AlgorithmComparison from "@/components/algorithm-comparison"
import WorkflowData from "@/components/workflow-data"
import { useSimulation } from "@/context/simulation-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ComparisonTab() {
  // Set a valid default workflow type that exists in the workflowData object
  const [selectedWorkflow, setSelectedWorkflow] = useState("sample")
  const { getResultsByWorkflow, simulationResults } = useSimulation()

  const resultsForWorkflow = getResultsByWorkflow(selectedWorkflow)
  const hasResults = resultsForWorkflow.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Comparison</CardTitle>
          <CardDescription>Compare algorithm performance across different scientific workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Select Workflow</label>
            <div className="flex items-center gap-2">
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sample">Sample Workflow (Paper Example)</SelectItem>
                  <SelectItem value="montage">Montage (Astronomy)</SelectItem>
                  <SelectItem value="cybershake">CyberShake (Earthquake Science)</SelectItem>
                  <SelectItem value="ligo">LIGO (Gravitational Physics)</SelectItem>
                  <SelectItem value="epigenomics">Epigenomics (Biology)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("All simulation results:", simulationResults)
                  console.log("Results for workflow:", resultsForWorkflow)
                  console.log("Selected workflow type:", selectedWorkflow)
                  alert(
                    `Total results: ${simulationResults.length}, Results for ${selectedWorkflow}: ${resultsForWorkflow.length}`,
                  )
                }}
              >
                Debug
              </Button>
            </div>
          </div>

          {!hasResults && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No simulation data available</AlertTitle>
              <AlertDescription>
                Run a simulation with this workflow type first to see comparison data based on actual results. Using
                default comparison data for now.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Workflow Data</TabsTrigger>
              <TabsTrigger value="comparison">Algorithm Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="data">
              <WorkflowData workflowType={selectedWorkflow} />
            </TabsContent>

            <TabsContent value="comparison">
              <AlgorithmComparison workflowType={selectedWorkflow} simulationResults={resultsForWorkflow} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
