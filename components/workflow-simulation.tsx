"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSimulation } from "@/context/simulation-context"
import { FastForward } from "lucide-react"

// Import components
import WorkflowDiagram from "@/components/workflow-diagram"
import SimulationOverview from "@/components/simulation-overview"
import { initializeSimulation } from "@/lib/simulation-utils"
import type { Task, VM, WorkflowSimulationRef } from "@/types/simulation"
import { updateTaskStatus, forceCompleteAllTasks, calculateProgressAndCosts } from "@/lib/animation-utils"
import TaskDetailsTab from "@/components/task-details-tab"
import AllocationTab from "@/components/allocation-tab"
import OverviewTab from "@/components/overview-tab"

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

      // Reset deadline meeting status
      setDsawsMeetsDeadline(true)
      setCgaMeetsDeadline(deadlineFactor >= 1.5)
      setDynaMeetsDeadline(deadlineFactor >= 1.2)

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

      // Force-complete all tasks if simulation time is past a certain threshold
      // This is a fallback to ensure the simulation completes even if there are issues with dependency resolution
      const maxSimTime = deadline * 1.5 // Use 1.5x the deadline as a maximum simulation time
      if (elapsedTimeRef.current > maxSimTime) {
        forceCompleteAllTasks(
          dsawsTasksRef,
          cgaTasksRef,
          dynaTasksRef,
          setDsawsTasks,
          setCgaTasks,
          setDynaTasks,
          setDsawsProgress,
          setCgaProgress,
          setDynaProgress,
        )
      }

      // Calculate progress and costs
      const {
        dsawsProgress: newDsawsProgress,
        cgaProgress: newCgaProgress,
        dynaProgress: newDynaProgress,
        dsawsCost: newDsawsCost,
        cgaCost: newCgaCost,
        dynaCost: newDynaCost,
        dsawsAllCompleted,
        cgaAllCompleted,
        dynaAllCompleted,
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
