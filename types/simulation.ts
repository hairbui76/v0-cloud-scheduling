export type Task = {
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

export type VM = {
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

// Add this new type for the WorkflowSimulation ref
export type WorkflowSimulationRef = {
  resetSimulation: () => void
}
