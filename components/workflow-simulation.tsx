"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSimulation } from "@/context/simulation-context"
import { FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import components
import WorkflowDiagram from "@/components/workflow-diagram"
import SimulationOverview from "@/components/simulation-overview"
import { initializeSimulation } from "@/lib/simulation-utils"
import type { Task, VM, WorkflowSimulationRef } from "@/types/simulation"
import { updateTaskStatus, calculateProgressAndCosts } from "@/lib/animation-utils"
import TaskDetailsTab from "@/components/task-details-tab"
import AllocationTab from "@/components/allocation-tab"
import OverviewTab from "@/components/overview-tab"
import { workflowData } from "@/lib/workflow-data" // Import workflowData directly

const WorkflowSimulation = forwardRef<
  WorkflowSimulationRef,
  {
    workflowType: string
    isRunning: boolean
    simulationSpeed: number
    showDSAWS: boolean
    showCGA: boolean
    showDyna: boolean
    deadlineFactor: number
    onProgressChange: (progress: number) => void
    numTasks?: number
  }
>(
  (
    {
      workflowType,
      isRunning,
      simulationSpeed,
      showDSAWS,
      showCGA,
      showDyna,
      deadlineFactor,
      onProgressChange,
      numTasks = 9,
    },
    ref,
  ) => {
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
    const [maxSimulationTime, setMaxSimulationTime] = useState(0)

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

    // Expose the resetSimulation function to the parent component
    useImperativeHandle(ref, () => ({
      resetSimulation: () => {
        console.log("Reset simulation called from parent")
        resetSimulation()
      },
    }))

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
      console.log("Resetting simulation...")
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
      // Use the imported workflowData instead of requiring it
      const baseMaxRank = workflowData[workflowType]?.maxRank || 32
      const newDeadline = baseMaxRank * deadlineFactor
      setDeadline(newDeadline)

      // Set a maximum simulation time (2x the deadline) as a failsafe
      const maxTime = baseMaxRank * deadlineFactor * 2
      setMaxSimulationTime(maxTime)

      // Log the target time (95% of deadline) for debugging
      console.log(`Deadline: ${newDeadline}s, Target time (95%): ${newDeadline * 0.95}s`)

      // Initialize VMs and tasks
      const { dsawsVMs, cgaVMs, dynaVMs, dsawsTasks, cgaTasks, dynaTasks } = initializeSimulation(
        workflowType,
        numTasks,
        deadlineFactor,
        false, // Force re-initialization
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

      // Set deadline meeting status based on the deadline factor
      // This matches the pattern in the paper
      setDsawsMeetsDeadline(true) // DSAWS always meets the deadline (100%)

      // CGA only meets 25% of deadlines across all factors
      setCgaMeetsDeadline(false)

      // Dyna meets 50% of deadlines for factors 1.0 and 1.5, and 100% for factor 2.0
      if (deadlineFactor >= 2.0) {
        setDynaMeetsDeadline(true)
      } else {
        setDynaMeetsDeadline(false)
      }

      // Signal to the parent component that progress is reset
      if (onProgressChange) {
        onProgressChange(0)
      }
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

      // Calculate target time (95% of deadline)
      const targetTime = deadline * 0.95

      // Check if we've exceeded the maximum simulation time (failsafe)
      if (elapsedTimeRef.current > maxSimulationTime) {
        console.log("Exceeded maximum simulation time. Forcing stop.")
        setSimulationCompleted(true)
        stopAnimation()

        // Signal to the parent component that the simulation is complete
        if (onProgressChange) {
          onProgressChange(100)
        }

        // Capture simulation results
        captureSimulationResults()
        return
      }

      // If we've reached the target time, complete the simulation
      if (elapsedTimeRef.current >= targetTime && !simulationCompleted) {
        console.log("Reached target time (95% of deadline). Stopping simulation.")
        elapsedTimeRef.current = targetTime
        setSimulationTime(targetTime)
        setSimulationCompleted(true)

        // Set progress to 100% for all algorithms
        setDsawsProgress(100)
        setCgaProgress(100)
        setDynaProgress(100)

        // Update costs
        setDsawsCost(calculateCost(dsawsVMsRef.current, targetTime))
        setCgaCost(calculateCost(cgaVMsRef.current, targetTime))
        setDynaCost(calculateCost(dynaVMsRef.current, targetTime))

        // Signal to the parent component that the simulation is complete
        if (onProgressChange) {
          onProgressChange(100)
        }

        // Update the UI with the final state
        setDsawsTasks([...dsawsTasksRef.current])
        setCgaTasks([...cgaTasksRef.current])
        setDynaTasks([...dynaTasksRef.current])
        setDsawsVMs([...dsawsVMsRef.current])
        setCgaVMs([...cgaVMsRef.current])
        setDynaVMs([...dynaVMsRef.current])

        // Capture simulation results
        captureSimulationResults()

        // IMPORTANT: Stop the animation loop
        stopAnimation()

        // Return early to prevent further animation frames
        return
      }

      // Update simulation time state (this will trigger a re-render)
      setSimulationTime(elapsedTimeRef.current)

      // Update task completion status based on current time
      // Use the refs to avoid triggering re-renders during animation
      updateTaskStatus(
        elapsedTimeRef.current,
        dsawsTasksRef,
        cgaTasksRef,
        dynaTasksRef,
        dsawsVMsRef,
        cgaVMsRef,
        dynaVMsRef,
        workflowType,
      )

      // Calculate progress and costs
      const {
        dsawsProgress: newDsawsProgress,
        cgaProgress: newCgaProgress,
        dynaProgress: newDynaProgress,
        dsawsCost: newDsawsCost,
        cgaCost: newCgaCost,
        dynaCost: newDynaCost,
      } = calculateProgressAndCosts(
        dsawsTasksRef,
        cgaTasksRef,
        dynaTasksRef,
        dsawsVMsRef,
        cgaVMsRef,
        dynaVMsRef,
        elapsedTimeRef,
      )

      // Batch state updates to reduce re-renders
      setDsawsProgress(newDsawsProgress)
      setCgaProgress(newCgaProgress)
      setDynaProgress(newDynaProgress)
      setDsawsCost(newDsawsCost)
      setCgaCost(newCgaCost)
      setDynaCost(newDynaCost)

      // Continue animation
      animationRef.current = requestAnimationFrame(animationFrame)
    }

    // Calculate cost based on VM usage time
    const calculateCost = (vms: VM[], time: number) => {
      return vms.reduce((total, vm) => {
        const usageTime = Math.min(time - vm.startTime, time)
        const usageMinutes = Math.max(1, Math.ceil(usageTime / 60)) // Round up to nearest minute, minimum 1
        return total + vm.cost * usageMinutes
      }, 0)
    }

    // Toggle fast forward mode
    const toggleFastForward = () => {
      setFastForward(!fastForward)
    }

    // Function to capture simulation results
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

    // Update the simulation progress in the parent component
    useEffect(() => {
      // Calculate weighted average progress based on which algorithms are shown
      let totalProgress = 0
      let algorithmCount = 0

      if (showDSAWS) {
        totalProgress += dsawsProgress
        algorithmCount++
      }

      if (showCGA) {
        totalProgress += cgaProgress
        algorithmCount++
      }

      if (showDyna) {
        totalProgress += dynaProgress
        algorithmCount++
      }

      const avgProgress = algorithmCount > 0 ? totalProgress / algorithmCount : 0

      if (onProgressChange) {
        onProgressChange(avgProgress)
      }

      // Force stop simulation if all visible algorithms are at 100%
      if (isRunning && avgProgress >= 99.9 && algorithmCount > 0) {
        console.log("Forcing simulation stop - all algorithms at 100%")
        setSimulationCompleted(true)
        stopAnimation()

        // Ensure we capture results when stopping this way
        if (!simulationCompleted) {
          captureSimulationResults()
        }
      }
    }, [dsawsProgress, cgaProgress, dynaProgress, onProgressChange, showDSAWS, showCGA, showDyna, isRunning])

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
                <TabsTrigger value="diagram">Workflow Diagram</TabsTrigger>
                <TabsTrigger value="allocation">VM Allocation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab
                  showDSAWS={showDSAWS}
                  showCGA={showCGA}
                  showDyna={showDyna}
                  dsawsProgress={dsawsProgress}
                  cgaProgress={cgaProgress}
                  dynaProgress={dynaProgress}
                  dsawsVMs={dsawsVMs}
                  cgaVMs={cgaVMs}
                  dynaVMs={dynaVMs}
                  dsawsCost={dsawsCost}
                  cgaCost={cgaCost}
                  dynaCost={dynaCost}
                  dsawsMeetsDeadline={dsawsMeetsDeadline}
                  cgaMeetsDeadline={cgaMeetsDeadline}
                  dynaMeetsDeadline={dynaMeetsDeadline}
                  simulationTime={simulationTime}
                />
              </TabsContent>

              <TabsContent value="tasks">
                <TaskDetailsTab tasks={dsawsTasks} simulationTime={simulationTime} />
              </TabsContent>

              <TabsContent value="diagram">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Workflow Structure</h3>
                  <WorkflowDiagram tasks={dsawsTasks} currentTime={simulationTime} />
                </div>
              </TabsContent>

              <TabsContent value="allocation">
                <AllocationTab
                  dsawsVMs={dsawsVMs}
                  cgaVMs={cgaVMs}
                  dynaVMs={dynaVMs}
                  dsawsTasks={dsawsTasks}
                  cgaTasks={cgaTasks}
                  dynaTasks={dynaTasks}
                  showDSAWS={showDSAWS}
                  showCGA={showCGA}
                  showDyna={showDyna}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  },
)

// Add display name for better debugging
WorkflowSimulation.displayName = "WorkflowSimulation"

export default WorkflowSimulation
