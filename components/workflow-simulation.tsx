"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSimulation } from "@/context/simulation-context"
import { FastForward } from "lucide-react"

// Import the SVG-based components
import WorkflowDiagram from "@/components/workflow-diagram"
import TaskAllocationVisualization from "@/components/task-allocation-visualization"
import AllocationComparison from "@/components/allocation-comparison"
import SimulationOverview from "@/components/simulation-overview"
import SimulationVMDetails from "@/components/simulation-vm-details"
import { initializeSimulation, calculateCost } from "@/lib/simulation-utils"
import type { Task, VM } from "@/types/simulation"
// Import the CustomBadge component
import { CustomBadge } from "@/components/ui/custom-badge"

export default function WorkflowSimulation({
  workflowType,
  isRunning,
  simulationSpeed,
  showDSAWS,
  showCGA,
  showDyna,
  deadlineFactor,
  onProgressChange,
  numTasks = 9,
}) {
  const [simulationTime, setSimulationTime] = useState(0)
  const [dsawsProgress, setDsawsProgress] = useState(0)
  const [cgaProgress, setCgaProgress] = useState(0)
  const [dynaProgress, setDynaProgress] = useState(0)
  const [dsawsCost, setDsawsCost] = useState(0)
  const [cgaCost, setCgaCost] = useState(0)
  const [dynaCost, setDynaCost] = useState(0)
  const [dsawsVMs, setDsawsVMs] = useState<VM[]>([])
  const [cgaVMs, setCgaVMs] = useState<VM[]>([])
  const [dynaVMs, setDynaVMs] = useState<VM[]>([])
  const [deadline, setDeadline] = useState(0)
  const [dsawsMeetsDeadline, setDsawsMeetsDeadline] = useState(true)
  const [cgaMeetsDeadline, setCgaMeetsDeadline] = useState(false)
  const [dynaMeetsDeadline, setDynaMeetsDeadline] = useState(false)
  const [fastForward, setFastForward] = useState(false)
  const [dsawsTasks, setDsawsTasks] = useState<Task[]>([])
  const [cgaTasks, setCgaTasks] = useState<Task[]>([])
  const [dynaTasks, setDynaTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [simulationCompleted, setSimulationCompleted] = useState(false)

  const { addSimulationResult } = useSimulation()

  // Use a ref to track initialization state
  const initializedRef = useRef(false)

  // Use refs for animation state to avoid closure issues
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const elapsedTimeRef = useRef<number>(0)

  // Store the current task count and max time for reference
  const taskCountRef = useRef(numTasks)

  // Use refs to track task completion to avoid excessive re-renders
  const dsawsTasksRef = useRef<Task[]>([])
  const cgaTasksRef = useRef<Task[]>([])
  const dynaTasksRef = useRef<Task[]>([])
  const dsawsVMsRef = useRef<VM[]>([])
  const cgaVMsRef = useRef<VM[]>([])
  const dynaVMsRef = useRef<VM[]>([])

  // Initialize simulation based on workflow type or when user changes task count or max time
  useEffect(() => {
    // Update refs with current values
    taskCountRef.current = numTasks

    // Reset initialization flag
    initializedRef.current = false

    // Reset simulation completed flag
    setSimulationCompleted(false)

    resetSimulation()
  }, [workflowType, deadlineFactor, numTasks])

  // Handle simulation running state
  useEffect(() => {
    if (isRunning) {
      startAnimation()
    } else {
      stopAnimation()
    }

    return () => {
      stopAnimation()
    }
  }, [isRunning, fastForward])

  const resetSimulation = () => {
    // Stop any running animation
    stopAnimation()

    // Reset all state
    setSimulationTime(0)
    setDsawsProgress(0)
    setCgaProgress(0)
    setDynaProgress(0)
    setDsawsCost(0)
    setCgaCost(0)
    setDynaCost(0)
    setFastForward(false)
    elapsedTimeRef.current = 0
    setSimulationCompleted(false)

    // Set deadline based on workflow type and factor
    const workflowData = {
      sample: { maxRank: 32 },
      montage: { maxRank: 369 },
      cybershake: { maxRank: 736 },
      ligo: { maxRank: 625 },
      epigenomics: { maxRank: 27232 },
    }

    const baseMaxRank = workflowData[workflowType]?.maxRank || 32
    setDeadline(baseMaxRank * deadlineFactor)

    // Initialize VMs and tasks
    const { dsawsVMs, cgaVMs, dynaVMs, dsawsTasks, cgaTasks, dynaTasks } = initializeSimulation(
      workflowType,
      numTasks,
      deadlineFactor,
      initializedRef.current,
    )

    initializedRef.current = true

    // Update both state and refs
    setDsawsVMs(dsawsVMs)
    setCgaVMs(cgaVMs)
    setDynaVMs(dynaVMs)
    setDsawsTasks(dsawsTasks)
    setCgaTasks(cgaTasks)
    setDynaTasks(dynaTasks)

    dsawsVMsRef.current = dsawsVMs
    cgaVMsRef.current = cgaVMs
    dynaVMsRef.current = dynaVMs
    dsawsTasksRef.current = dsawsTasks
    cgaTasksRef.current = cgaTasks
    dynaTasksRef.current = dynaTasks

    // Reset deadline meeting status
    setDsawsMeetsDeadline(true)
    setCgaMeetsDeadline(deadlineFactor >= 1.5)
    setDynaMeetsDeadline(deadlineFactor >= 1.2)
  }

  const startAnimation = () => {
    if (animationRef.current !== null) return

    startTimeRef.current = performance.now()
    lastFrameTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(animationFrame)
  }

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const animationFrame = (timestamp: number) => {
    // Calculate time delta
    const deltaTime = timestamp - lastFrameTimeRef.current
    lastFrameTimeRef.current = timestamp

    // Apply speed multiplier
    const speedMultiplier = fastForward ? 10 * simulationSpeed : simulationSpeed

    // Update elapsed time (in seconds)
    elapsedTimeRef.current += (deltaTime * speedMultiplier) / 1000

    // Update simulation time state (this will trigger a re-render)
    setSimulationTime(elapsedTimeRef.current)

    // Update task completion status based on current time
    // Use the refs to avoid triggering re-renders during animation
    updateTaskStatus(elapsedTimeRef.current)

    // Force-complete all tasks if simulation time is past a certain threshold
    // This is a fallback to ensure the simulation completes even if there are issues with dependency resolution
    const maxSimTime = deadline * 1.5 // Use 1.5x the deadline as a maximum simulation time
    if (elapsedTimeRef.current > maxSimTime) {
      forceCompleteAllTasks()
    }

    // Calculate progress based on completed tasks
    const dsawsCompletedTasks = dsawsTasksRef.current.filter((task) => task.completed).length
    const dsawsProgressPercent =
      dsawsTasksRef.current.length > 0 ? (dsawsCompletedTasks / dsawsTasksRef.current.length) * 100 : 100

    const cgaCompletedTasks = cgaTasksRef.current.filter((task) => task.completed).length
    const cgaProgressPercent =
      cgaTasksRef.current.length > 0 ? (cgaCompletedTasks / cgaTasksRef.current.length) * 100 : 100

    const dynaCompletedTasks = dynaTasksRef.current.filter((task) => task.completed).length
    const dynaProgressPercent =
      dynaTasksRef.current.length > 0 ? (dynaCompletedTasks / dynaTasksRef.current.length) * 100 : 100

    // Calculate costs
    const dsawsCostValue = calculateCost(dsawsVMsRef.current, elapsedTimeRef.current)
    const cgaCostValue = calculateCost(cgaVMsRef.current, elapsedTimeRef.current)
    const dynaCostValue = calculateCost(dynaVMsRef.current, elapsedTimeRef.current)

    // Batch state updates to reduce re-renders
    // We'll update the state only once per animation frame
    setDsawsProgress(dsawsCompletedTasks === dsawsTasksRef.current.length ? 100 : dsawsProgressPercent)
    setCgaProgress(cgaCompletedTasks === cgaTasksRef.current.length ? 100 : cgaProgressPercent)
    setDynaProgress(dynaCompletedTasks === dynaTasksRef.current.length ? 100 : dynaProgressPercent)
    setDsawsCost(dsawsCostValue)
    setCgaCost(cgaCostValue)
    setDynaCost(dynaCostValue)

    // Check if all tasks are completed for each algorithm
    const dsawsAllCompleted = dsawsCompletedTasks === dsawsTasksRef.current.length && dsawsTasksRef.current.length > 0
    const cgaAllCompleted = cgaCompletedTasks === cgaTasksRef.current.length && cgaTasksRef.current.length > 0
    const dynaAllCompleted = dynaCompletedTasks === dynaTasksRef.current.length && dynaTasksRef.current.length > 0

    // Update deadline meeting status
    if (dsawsAllCompleted) {
      setDsawsMeetsDeadline(elapsedTimeRef.current <= deadline)
    }
    if (cgaAllCompleted) {
      setCgaMeetsDeadline(elapsedTimeRef.current <= deadline)
    }
    if (dynaAllCompleted) {
      setDynaMeetsDeadline(elapsedTimeRef.current <= deadline)
    }

    // Continue animation if not complete or force stop if all tasks are done
    const allTasksCompleted = dsawsAllCompleted && cgaAllCompleted && dynaAllCompleted

    if (!allTasksCompleted) {
      animationRef.current = requestAnimationFrame(animationFrame)
    } else {
      // Mark simulation as completed
      setSimulationCompleted(true)

      // Stop the animation
      stopAnimation()

      // Signal to the parent component that the simulation is complete
      if (onProgressChange) {
        onProgressChange(100) // Signal 100% completion
      }

      // Update the UI with the final state
      setDsawsTasks([...dsawsTasksRef.current])
      setCgaTasks([...cgaTasksRef.current])
      setDynaTasks([...dynaTasksRef.current])
      setDsawsVMs([...dsawsVMsRef.current])
      setCgaVMs([...cgaVMsRef.current])
      setDynaVMs([...dynaVMsRef.current])
    }
  }

  // Force complete all tasks - used as a fallback
  const forceCompleteAllTasks = () => {
    // Update refs first
    dsawsTasksRef.current = dsawsTasksRef.current.map((task) => ({ ...task, completed: true }))
    cgaTasksRef.current = cgaTasksRef.current.map((task) => ({ ...task, completed: true }))
    dynaTasksRef.current = dynaTasksRef.current.map((task) => ({ ...task, completed: true }))

    // Then update state (this will be batched)
    setDsawsTasks([...dsawsTasksRef.current])
    setCgaTasks([...cgaTasksRef.current])
    setDynaTasks([...dynaTasksRef.current])

    // Set progress to 100%
    setDsawsProgress(100)
    setCgaProgress(100)
    setDynaProgress(100)
  }

  const updateTaskStatus = (currentTime: number) => {
    // For the sample workflow, we'll use a simplified approach
    if (workflowType === "sample") {
      // Mark tasks as completed based on their end time
      dsawsTasksRef.current = dsawsTasksRef.current.map((task) => {
        if (!task.completed && currentTime >= (task.endTime || 0)) {
          return { ...task, completed: true }
        }
        return task
      })

      cgaTasksRef.current = cgaTasksRef.current.map((task) => {
        if (!task.completed && currentTime >= (task.endTime || 0)) {
          return { ...task, completed: true }
        }
        return task
      })

      dynaTasksRef.current = dynaTasksRef.current.map((task) => {
        if (!task.completed && currentTime >= (task.endTime || 0)) {
          return { ...task, completed: true }
        }
        return task
      })
    } else {
      // For other workflows, use the dependency-based approach
      // First pass: Mark tasks as completed if time has passed and dependencies are completed
      dsawsTasksRef.current = dsawsTasksRef.current.map((task) => {
        // Only process tasks that aren't already completed
        if (!task.completed) {
          // Check if all dependencies are completed
          const dependenciesCompleted = task.dependencies.every((depId) => {
            const depTask = dsawsTasksRef.current.find((t) => t.id === depId)
            return depTask?.completed === true
          })

          // Mark as completed if time has passed AND all dependencies are completed
          if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
            return { ...task, completed: true }
          }
        }
        return task
      })

      // Update CGA tasks with the same logic
      cgaTasksRef.current = cgaTasksRef.current.map((task) => {
        if (!task.completed) {
          const dependenciesCompleted = task.dependencies.every((depId) => {
            const depTask = cgaTasksRef.current.find((t) => t.id === depId)
            return depTask?.completed === true
          })

          if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
            return { ...task, completed: true }
          }
        }
        return task
      })

      // Update Dyna tasks with the same logic
      dynaTasksRef.current = dynaTasksRef.current.map((task) => {
        if (!task.completed) {
          const dependenciesCompleted = task.dependencies.every((depId) => {
            const depTask = dynaTasksRef.current.find((t) => t.id === depId)
            return depTask?.completed === true
          })

          if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
            return { ...task, completed: true }
          }
        }
        return task
      })
    }

    // Update VM current times
    dsawsVMsRef.current = dsawsVMsRef.current.map((vm) => {
      // Find the latest task end time for this VM
      const vmTasks = dsawsTasksRef.current.filter((task) => task.assignedVM === vm.id)
      const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)

      return {
        ...vm,
        currentTime: Math.min(currentTime, latestEndTime),
      }
    })

    // Update CGA VMs
    cgaVMsRef.current = cgaVMsRef.current.map((vm) => {
      const vmTasks = cgaTasksRef.current.filter((task) => task.assignedVM === vm.id)
      const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)
      return {
        ...vm,
        currentTime: Math.min(currentTime, latestEndTime),
      }
    })

    // Update Dyna VMs
    dynaVMsRef.current = dynaVMsRef.current.map((vm) => {
      const vmTasks = dynaTasksRef.current.filter((task) => task.assignedVM === vm.id)
      const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)
      return {
        ...vm,
        currentTime: Math.min(currentTime, latestEndTime),
      }
    })

    // Update the state more frequently to keep the UI in sync
    // This ensures task status is displayed correctly
    if (Math.floor(currentTime * 10) % 5 === 0) {
      // Update every 0.5 seconds of simulation time
      setDsawsTasks([...dsawsTasksRef.current])
      setCgaTasks([...cgaTasksRef.current])
      setDynaTasks([...dynaTasksRef.current])
      setDsawsVMs([...dsawsVMsRef.current])
      setCgaVMs([...cgaVMsRef.current])
      setDynaVMs([...dynaVMsRef.current])
    }
  }

  // Update the simulation progress in the parent component
  useEffect(() => {
    const avgProgress = (dsawsProgress + cgaProgress + dynaProgress) / 3
    if (onProgressChange) {
      onProgressChange(avgProgress)
    }
  }, [dsawsProgress, cgaProgress, dynaProgress, onProgressChange])

  // Toggle fast forward mode
  const toggleFastForward = () => {
    setFastForward(!fastForward)
  }

  // Function to capture simulation results
  useEffect(() => {
    if (simulationCompleted && !isRunning) {
      captureSimulationResults()
    }
  }, [simulationCompleted, isRunning])

  const captureSimulationResults = () => {
    // Capture DSAWS results
    if (showDSAWS) {
      const dsawsVMUtilization = Array.from({ length: 10 }, (_, i) => {
        const timePoint = (i / 9) * simulationTime
        return { time: timePoint, vms: dsawsVMs.length }
      })

      addSimulationResult({
        algorithm: "DSAWS",
        completionTime: simulationTime,
        cost: dsawsCost,
        meetsDeadline: dsawsMeetsDeadline,
        vmCount: dsawsVMs.length,
        taskCount: dsawsTasks.length,
        vmUtilization: dsawsVMUtilization,
        workflowType,
        deadlineFactor,
      })
    }

    // Capture CGA results
    if (showCGA) {
      const cgaVMUtilization = Array.from({ length: 10 }, (_, i) => {
        const timePoint = (i / 9) * simulationTime
        return { time: timePoint, vms: cgaVMs.length }
      })

      addSimulationResult({
        algorithm: "CGA",
        completionTime: simulationTime,
        cost: cgaCost,
        meetsDeadline: cgaMeetsDeadline,
        vmCount: cgaVMs.length,
        taskCount: cgaTasks.length,
        vmUtilization: cgaVMUtilization,
        workflowType,
        deadlineFactor,
      })
    }

    // Capture Dyna results
    if (showDyna) {
      const dynaVMUtilization = Array.from({ length: 10 }, (_, i) => {
        const timePoint = (i / 9) * simulationTime
        return { time: timePoint, vms: dynaVMs.length }
      })

      addSimulationResult({
        algorithm: "Dyna",
        completionTime: simulationTime,
        cost: dynaCost,
        meetsDeadline: dynaMeetsDeadline,
        vmCount: dynaVMs.length,
        taskCount: dynaTasks.length,
        vmUtilization: dynaVMUtilization,
        workflowType,
        deadlineFactor,
      })
    }
  }

  // Helper function to determine task status for the task details table
  const getTaskStatus = (task: Task) => {
    if (task.completed) {
      return "completed"
    } else if (simulationTime >= (task.startTime || 0)) {
      return "running"
    } else {
      return "waiting"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Workflow Simulation {isRunning && <span className="text-green-500 ml-2">(Running)</span>}
            </CardTitle>
            {isRunning && (
              <Button
                variant={fastForward ? "default" : "outline"}
                size="sm"
                onClick={toggleFastForward}
                className="flex items-center gap-1"
              >
                <FastForward className="h-4 w-4" />
                {fastForward ? "Normal Speed" : "Fast Forward"}
              </Button>
            )}
          </div>
          <CardDescription>Simulating {numTasks} tasks with varied runtimes as per the DSAWS paper</CardDescription>
        </CardHeader>
        <CardContent>
          <SimulationOverview simulationTime={simulationTime} deadline={deadline} isRunning={isRunning} />

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Task Details</TabsTrigger>
              {/* <TabsTrigger value="timeline">Timeline</TabsTrigger> */}
              <TabsTrigger value="diagram">Workflow Diagram</TabsTrigger>
              <TabsTrigger value="allocation">VM Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {showDSAWS && (
                  <SimulationVMDetails
                    algorithm="DSAWS"
                    progress={dsawsProgress}
                    vms={dsawsVMs}
                    cost={dsawsCost}
                    meetsDeadline={dsawsMeetsDeadline}
                    simulationTime={simulationTime}
                  />
                )}

                {showCGA && (
                  <SimulationVMDetails
                    algorithm="CGA"
                    progress={cgaProgress}
                    vms={cgaVMs}
                    cost={cgaCost}
                    meetsDeadline={cgaMeetsDeadline}
                    simulationTime={simulationTime}
                  />
                )}

                {showDyna && (
                  <SimulationVMDetails
                    algorithm="Dyna"
                    progress={dynaProgress}
                    vms={dynaVMs}
                    cost={dynaCost}
                    meetsDeadline={dynaMeetsDeadline}
                    simulationTime={simulationTime}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">DSAWS Task Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Runtime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VM
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dsawsTasks
                        .sort((a, b) => b.rank - a.rank) // Sort by rank (highest first)
                        .map((task) => {
                          const status = getTaskStatus(task)
                          return (
                            <tr key={task.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {task.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.rank}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.runtime}s</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedVM}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.startTime}s</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.endTime}s</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {status === "completed" ? (
                                  <CustomBadge variant="success">Completed</CustomBadge>
                                ) : status === "running" ? (
                                  <CustomBadge variant="default">Running</CustomBadge>
                                ) : (
                                  <CustomBadge variant="outline">Waiting</CustomBadge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* <TabsContent value="timeline">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">DSAWS Timeline</h3>
                <TimelineVisualization
                  tasks={dsawsTasks}
                  vms={dsawsVMs}
                  currentTime={simulationTime}
                  maxTime={deadline}
                />
              </div>
            </TabsContent> */}

            <TabsContent value="diagram">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Workflow Structure</h3>
                <WorkflowDiagram tasks={dsawsTasks} currentTime={simulationTime} />
              </div>
            </TabsContent>

            <TabsContent value="allocation">
              <div className="space-y-6">
                <AllocationComparison
                  dsawsVMs={dsawsVMs}
                  cgaVMs={cgaVMs}
                  dynaVMs={dynaVMs}
                  dsawsTasks={dsawsTasks}
                  cgaTasks={cgaTasks}
                  dynaTasks={dynaTasks}
                />

                <div className="grid grid-cols-1 gap-6">
                  {showDSAWS && <TaskAllocationVisualization vms={dsawsVMs} tasks={dsawsTasks} algorithm="DSAWS" />}
                  {showCGA && <TaskAllocationVisualization vms={cgaVMs} tasks={cgaTasks} algorithm="CGA" />}
                  {showDyna && <TaskAllocationVisualization vms={dynaVMs} tasks={dynaTasks} algorithm="Dyna" />}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
