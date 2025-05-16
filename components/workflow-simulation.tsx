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

    setDsawsVMs(dsawsVMs)
    setCgaVMs(cgaVMs)
    setDynaVMs(dynaVMs)
    setDsawsTasks(dsawsTasks)
    setCgaTasks(cgaTasks)
    setDynaTasks(dynaTasks)

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

    // Update simulation time state
    setSimulationTime(elapsedTimeRef.current)

    // Update task completion status based on current time
    updateTaskStatus(elapsedTimeRef.current)

    // Update algorithm progress based on completed tasks
    const dsawsCompletedTasks = dsawsTasks.filter((task) => task.completed).length
    const dsawsProgressPercent = (dsawsCompletedTasks / dsawsTasks.length) * 100
    setDsawsProgress(dsawsProgressPercent)

    const cgaCompletedTasks = cgaTasks.filter((task) => task.completed).length
    const cgaProgressPercent = (cgaCompletedTasks / cgaTasks.length) * 100
    setCgaProgress(cgaProgressPercent)

    const dynaCompletedTasks = dynaTasks.filter((task) => task.completed).length
    const dynaProgressPercent = (dynaCompletedTasks / dynaTasks.length) * 100
    setDynaProgress(dynaProgressPercent)

    // For CGA and Dyna, use simpler progress calculation
    // setCgaProgress(Math.min(100, progressPercent))
    // setDynaProgress(Math.min(100, progressPercent * 0.9)) // Dyna is slightly slower

    // Update costs
    setDsawsCost(calculateCost(dsawsVMs, elapsedTimeRef.current))
    setCgaCost(calculateCost(cgaVMs, elapsedTimeRef.current))
    setDynaCost(calculateCost(dynaVMs, elapsedTimeRef.current))

    // Check deadline compliance
    // if (elapsedTimeRef.current > deadline) {
    //   if (dsawsProgress < 100) setDsawsMeetsDeadline(false)
    //   if (cgaProgress < 100) setCgaMeetsDeadline(false)
    //   if (dynaProgress < 100) setDynaMeetsDeadline(false)
    // }

    console.log("========================================")
    console.log("dsawsCompletedTasks", dsawsCompletedTasks)
    console.log("dsawsTasks.length", dsawsTasks.length)

    console.log("cgaCompletedTasks", cgaCompletedTasks)
    console.log("cgaTasks.length", cgaTasks.length)

    console.log("dynaCompletedTasks", dynaCompletedTasks)
    console.log("dynaTasks.length", dynaTasks.length)
    console.log("========================================")

    // Check if all DSAWS tasks completed
    if (dsawsCompletedTasks === dsawsTasks.length) {
      setDsawsMeetsDeadline(true)
      setDsawsProgress(100)
    }

    // Check if all CGA tasks completed
    if (cgaCompletedTasks === cgaTasks.length) {
      setCgaMeetsDeadline(true)
      setCgaProgress(100)
    }

    // Check if all Dyna tasks completed
    if (dynaCompletedTasks === dynaTasks.length) {
      setDynaMeetsDeadline(true)
      setDynaProgress(100)
    }

    // Continue animation if not complete
    if (dsawsProgress < 100 || cgaProgress < 100 || dynaProgress < 100) {
      animationRef.current = requestAnimationFrame(animationFrame)
    } else {
      // Mark simulation as completed
      setSimulationCompleted(true)

      // Stop the animation and update the running state
      stopAnimation()
      // Signal to the parent component that the simulation is no longer running
      if (isRunning) {
        // Use a timeout to avoid state update conflicts
        setTimeout(() => {
          if (onProgressChange) {
            onProgressChange(100) // Signal 100% completion
          }
        }, 0)
      }
    }
  }

  const updateTaskStatus = (currentTime: number) => {
    // Update DSAWS tasks
    const updatedDsawsTasks = dsawsTasks.map((task) => {
      // check if dependencies are completed
      const dependenciesCompleted = task.dependencies.every((dependency) => {
        const dependencyTask = dsawsTasks.find((t) => t.id === dependency)
        return dependencyTask?.completed
      })
      if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && !task.completed && dependenciesCompleted) {
        return { ...task, completed: true }
      }
      return task
    })
    setDsawsTasks(updatedDsawsTasks)

    // Update VM current times
    const updatedDsawsVMs = dsawsVMs.map((vm) => {
      // Find the latest task end time for this VM
      const vmTasks = updatedDsawsTasks.filter((task) => task.assignedVM === vm.id)
      const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)

      return {
        ...vm,
        currentTime: Math.min(currentTime, latestEndTime),
      }
    })
    setDsawsVMs(updatedDsawsVMs)
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
                        .map((task) => (
                          <tr key={task.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.rank}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.runtime}s</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedVM}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.startTime}s</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.endTime}s</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {simulationTime >= (task.endTime || Number.POSITIVE_INFINITY) ? (
                                <CustomBadge variant="success">Completed</CustomBadge>
                              ) : simulationTime >= (task.startTime || Number.POSITIVE_INFINITY) ? (
                                <CustomBadge variant="default">Running</CustomBadge>
                              ) : (
                                <CustomBadge variant="outline">Waiting</CustomBadge>
                              )}
                            </td>
                          </tr>
                        ))}
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
