"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define types for our simulation results
export type SimulationResult = {
  algorithm: string
  completionTime: number
  cost: number
  meetsDeadline: boolean
  vmCount: number
  taskCount: number
  vmUtilization: { time: number; vms: number }[]
  workflowType: string
  deadlineFactor: number
}

type SimulationContextType = {
  simulationResults: SimulationResult[]
  addSimulationResult: (result: SimulationResult) => void
  clearSimulationResults: () => void
  getResultsByWorkflow: (workflowType: string) => SimulationResult[]
  getSimulationWorkflowType: () => string
  setSimulationWorkflowType: (workflowType: string) => void
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [currentWorkflowType, setCurrentWorkflowType] = useState<string>("sample")

  const addSimulationResult = (result: SimulationResult) => {
    console.log("Adding simulation result:", result)
    setSimulationResults((prev) => {
      // Remove any previous results for the same algorithm and workflow type
      const filtered = prev.filter((r) => !(r.algorithm === result.algorithm && r.workflowType === result.workflowType))
      return [...filtered, result]
    })
  }

  const clearSimulationResults = () => {
    setSimulationResults([])
  }

  const getResultsByWorkflow = (workflowType: string) => {
    return simulationResults.filter((result) => result.workflowType === workflowType)
  }

  const getSimulationWorkflowType = () => {
    return currentWorkflowType
  }

  const setSimulationWorkflowType = (workflowType: string) => {
    setCurrentWorkflowType(workflowType)
  }

  return (
    <SimulationContext.Provider
      value={{
        simulationResults,
        addSimulationResult,
        clearSimulationResults,
        getResultsByWorkflow,
        getSimulationWorkflowType,
        setSimulationWorkflowType,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

// Make sure this function is properly exported
export function useSimulation() {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
