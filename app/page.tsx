"use client"

import SimulationTab from "@/components/simulation-tab"
import { SimulationProvider } from "@/context/simulation-context"
import AlgorithmComparisonSection from "@/components/algorithm-comparison-section"
import { useState } from "react"

export default function Home() {
  const [simulationDone, setSimulationDone] = useState(false)

  return (
    <SimulationProvider>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Cloud Scheduling Algorithm Comparison</h1>

        <div className="space-y-8">
          <SimulationTab onSimulationComplete={() => setSimulationDone(true)} />
          <AlgorithmComparisonSection done={simulationDone} />
        </div>
      </div>
    </SimulationProvider>
  )
}
