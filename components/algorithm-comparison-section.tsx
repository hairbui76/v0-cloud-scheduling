"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AlgorithmComparison from "@/components/algorithm-comparison"
import { useSimulation } from "@/context/simulation-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useState } from "react"

export default function AlgorithmComparisonSection() {
  const { getSimulationWorkflowType, getResultsByWorkflow } = useSimulation()
  const [done, setDone] = useState(false)

  // Get the current workflow type from the simulation context
  const workflowType = getSimulationWorkflowType() || "sample"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algorithm Comparison</CardTitle>
        <CardDescription>Compare the performance of DSAWS, CGA, and Dyna scheduling algorithms</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Get results for the current workflow type */}
        {(() => {
          const resultsForWorkflow = getResultsByWorkflow(workflowType)
          const hasResults = resultsForWorkflow.length > 0

          return (
            <>
              {!hasResults && (
                <Alert variant="warning" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No simulation data available</AlertTitle>
                  <AlertDescription>
                    Run a simulation with the current workflow type first to see comparison data based on actual
                    results. Using default comparison data for now.
                  </AlertDescription>
                </Alert>
              )}

              <AlgorithmComparison workflowType={workflowType} simulationResults={resultsForWorkflow} done={done}/>
            </>
          )
        })()}
      </CardContent>
    </Card>
  )
}
