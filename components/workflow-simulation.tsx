"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Server, DollarSign, FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSimulation } from "@/context/simulation-context"

// Import the SVG-based components
import WorkflowDiagram from "@/components/workflow-diagram"
import TimelineVisualization from "@/components/timeline-visualization"
import TaskAllocationVisualization from "@/components/task-allocation-visualization"
import AllocationComparison from "@/components/allocation-comparison"

// Define workflow task types
type Task = {
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

type VM = {
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

// Sample workflow data (simplified)
const workflowData = {
  sample: {
    tasks: 9,
    levels: 3,
    dependencies: 6,
    meanRuntime: 8.33,
    meanDataSize: 2.5,
    maxRank: 32,
  },
  montage: {
    tasks: 1000,
    levels: 9,
    dependencies: 4485,
    meanRuntime: 11.37,
    meanDataSize: 3.21,
    maxRank: 369,
  },
  cybershake: {
    tasks: 1000,
    levels: 5,
    dependencies: 3988,
    meanRuntime: 22.75,
    meanDataSize: 102.29,
    maxRank: 736,
  },
  ligo: {
    tasks: 1000,
    levels: 6,
    dependencies: 3246,
    meanRuntime: 227.78,
    meanDataSize: 8.9,
    maxRank: 625,
  },
  epigenomics: {
    tasks: 997,
    levels: 8,
    dependencies: 3228,
    meanRuntime: 3866.4,
    meanDataSize: 388.59,
    maxRank: 27232,
  },
}

// VM types based on Google Compute Engine
const vmTypes = [
  { name: "n1-standard-1", speed: 1, cost: 0.00105 },
  { name: "n1-standard-2", speed: 2, cost: 0.0021 },
  { name: "n1-standard-4", speed: 4, cost: 0.0042 },
  { name: "n1-standard-8", speed: 8, cost: 0.0084 },
  { name: "n1-standard-16", speed: 16, cost: 0.0168 },
  { name: "n1-standard-32", speed: 32, cost: 0.0336 },
  { name: "n1-standard-64", speed: 64, cost: 0.0672 },
]

// Add the onProgressChange prop to the component
export default function WorkflowSimulation({
  workflowType,
  isRunning,
  simulationSpeed,
  showDSAWS,
  showCGA,
  showDyna,
  deadlineFactor,
  onProgressChange,
  numTasks = 9, // Default to 9 tasks as in the paper example
  maxSimulationTime = 30, // Default to 30 seconds for the sample workflow
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
  const maxTimeRef = useRef(maxSimulationTime)

  // Initialize simulation based on workflow type or when user changes task count or max time
  useEffect(() => {
    // Update refs with current values
    taskCountRef.current = numTasks
    maxTimeRef.current = maxSimulationTime

    // Reset initialization flag
    initializedRef.current = false

    // Reset simulation completed flag
    setSimulationCompleted(false)

    resetSimulation()
  }, [workflowType, deadlineFactor, numTasks, maxSimulationTime])

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
    // For the sample workflow in the paper, the deadline is 32
    const baseMaxRank = workflowData[workflowType]?.maxRank || 32
    setDeadline(baseMaxRank * deadlineFactor)

    // Initialize VMs and tasks in a single function to avoid circular dependencies
    initializeSimulation()
  }

  // Helper function to select VM type based on algorithm and task characteristics
  const selectVMType = (algorithm: string, taskIndex: number, totalTasks: number) => {
    // For the sample workflow, use n1-standard-2 for all VMs
    if (workflowType === "sample") {
      return vmTypes[1] // n1-standard-2
    }

    // Calculate how many VM types to use based on task count
    // More tasks = more variety in VM types
    const maxVMTypeIndex = Math.min(vmTypes.length - 1, Math.max(1, Math.floor(Math.log2(numTasks / 10))))

    // Different algorithms select VM types differently
    switch (algorithm) {
      case "DSAWS":
        // DSAWS is more strategic - uses faster VMs for higher-ranked tasks
        // and slower VMs for lower-ranked tasks
        const taskPercentile = taskIndex / totalTasks
        if (taskPercentile < 0.2) {
          // Top 20% of tasks get faster VMs
          return vmTypes[Math.min(maxVMTypeIndex, 3 + Math.floor(Math.random() * 2))]
        } else if (taskPercentile < 0.5) {
          // Next 30% get medium VMs
          return vmTypes[Math.min(maxVMTypeIndex, 2 + Math.floor(Math.random() * 2))]
        } else {
          // Rest get slower VMs
          return vmTypes[Math.min(maxVMTypeIndex, Math.floor(Math.random() * 2) + 1)]
        }

      case "CGA":
        // CGA uses a more uniform distribution of VM types
        return vmTypes[Math.min(maxVMTypeIndex, 1 + Math.floor(Math.random() * maxVMTypeIndex))]

      case "Dyna":
        // Dyna prefers cost-effective options with occasional faster VMs
        const useFastVM = Math.random() < 0.2 // 20% chance of using a faster VM
        if (useFastVM) {
          return vmTypes[Math.min(maxVMTypeIndex, 2 + Math.floor(Math.random() * 2))]
        } else {
          return vmTypes[Math.min(maxVMTypeIndex, Math.floor(Math.random() * 2) + 1)]
        }

      default:
        return vmTypes[1] // Default to n1-standard-2
    }
  }

  const initializeSimulation = () => {
    // Skip if already initialized
    if (initializedRef.current) return
    initializedRef.current = true

    // Calculate number of VMs based on task count
    // Each algorithm scales differently based on its characteristics
    const dsawsVMCount = workflowType === "sample" ? 3 : Math.max(3, Math.ceil(numTasks / 100))
    const cgaVMCount = workflowType === "sample" ? 3 : Math.max(3, Math.ceil(numTasks / 80)) // CGA tends to use more VMs
    const dynaVMCount = workflowType === "sample" ? 2 : Math.max(2, Math.ceil(numTasks / 120)) // Dyna is more conservative

    // Create DSAWS VMs
    const dsawsVMList: VM[] = []
    for (let i = 1; i <= dsawsVMCount; i++) {
      // Select VM type based on algorithm and position
      const vmType =
        workflowType === "sample"
          ? vmTypes[1] // n1-standard-2 for sample workflow
          : selectVMType("DSAWS", i, dsawsVMCount)

      dsawsVMList.push({
        id: `vm${i}`,
        type: vmType.name,
        cost: vmType.cost,
        speed: vmType.speed,
        tasks: [], // Will be assigned later
        startTime: 0,
        algorithm: "DSAWS",
        currentTime: 0,
      })
    }

    // Create CGA VMs
    const cgaVMList: VM[] = []
    for (let i = 1; i <= cgaVMCount; i++) {
      // Select VM type based on algorithm and position
      const vmType =
        workflowType === "sample"
          ? vmTypes[1] // n1-standard-2 for sample workflow
          : selectVMType("CGA", i, cgaVMCount)

      cgaVMList.push({
        id: `cga-${i}`,
        type: vmType.name,
        cost: vmType.cost,
        speed: vmType.speed,
        tasks: [], // Will be assigned later
        startTime: 0,
        algorithm: "CGA",
        currentTime: 0,
      })
    }

    // Create Dyna VMs
    const dynaVMList: VM[] = []
    for (let i = 1; i <= dynaVMCount; i++) {
      // Select VM type based on algorithm and position
      const vmType =
        workflowType === "sample"
          ? vmTypes[1] // n1-standard-2 for sample workflow
          : selectVMType("Dyna", i, dynaVMCount)

      dynaVMList.push({
        id: `dyna-${i}`,
        type: vmType.name,
        cost: vmType.cost,
        speed: vmType.speed,
        tasks: [], // Will be assigned later
        startTime: 0,
        algorithm: "Dyna",
        currentTime: 0,
      })
    }

    // For the sample workflow, use the predefined task assignments from the paper
    if (workflowType === "sample") {
      // Assign tasks to DSAWS VMs as per the paper
      dsawsVMList[0].tasks = ["t2", "t5", "t8"]
      dsawsVMList[1].tasks = ["t1", "t4", "t7"]
      dsawsVMList[2].tasks = ["t3", "t6", "t9"]

      // Assign tasks to CGA VMs
      cgaVMList[0].tasks = ["t1", "t5", "t8"]
      cgaVMList[1].tasks = ["t2", "t4", "t7"]
      cgaVMList[2].tasks = ["t3", "t6", "t9"]

      // Assign tasks to Dyna VMs
      dynaVMList[0].tasks = ["t1", "t3", "t6", "t9"]
      dynaVMList[1].tasks = ["t2", "t4", "t5", "t7", "t8"]
    } else {
      // For larger workflows, distribute tasks among VMs
      // Create tasks based on the number specified
      const taskList: Task[] = []
      const levels = Math.min(10, Math.ceil(Math.sqrt(numTasks / 10))) // Estimate number of levels
      const tasksPerLevel = Math.ceil(numTasks / levels)

      let taskId = 1
      for (let level = 1; level <= levels; level++) {
        const levelTaskCount = Math.min(tasksPerLevel, numTasks - (taskId - 1))
        for (let i = 0; i < levelTaskCount; i++) {
          // Create dependencies to previous level tasks
          const dependencies: string[] = []
          if (level > 1) {
            // Each task depends on 1-3 tasks from the previous level
            const depCount = Math.min(3, tasksPerLevel)
            for (let d = 0; d < depCount; d++) {
              const depLevel = level - 1
              const depIndex = Math.floor(Math.random() * tasksPerLevel) + 1
              const depId = (depLevel - 1) * tasksPerLevel + depIndex
              if (depId < taskId) {
                dependencies.push(`t${depId}`)
              }
            }
          }

          // Add the task
          taskList.push({
            id: `t${taskId}`,
            name: `Task ${taskId}`,
            runtime: Math.floor(Math.random() * 10) + 5, // Random runtime between 5-15 seconds
            dependencies,
            rank: numTasks - taskId + 10, // Simple rank calculation
            completed: false,
            level,
          })

          taskId++
          if (taskId > numTasks) break
        }
        if (taskId > numTasks) break
      }

      // Distribute tasks among VMs for each algorithm
      // DSAWS: Tries to minimize data transfer by keeping related tasks on the same VM
      let dsawsVMIndex = 0
      for (let level = 1; level <= levels; level++) {
        const levelTasks = taskList.filter((t) => t.level === level)
        for (const task of levelTasks) {
          dsawsVMList[dsawsVMIndex % dsawsVMCount].tasks.push(task.id)
          dsawsVMIndex++
        }
      }

      // CGA: Distributes tasks more evenly but with less consideration for data locality
      for (let i = 0; i < taskList.length; i++) {
        const vmIndex = i % cgaVMCount
        cgaVMList[vmIndex].tasks.push(taskList[i].id)
      }

      // Dyna: Uses a probabilistic approach, tends to group more tasks on fewer VMs
      for (let i = 0; i < taskList.length; i++) {
        // Dyna tends to assign more tasks to the first VM
        const vmIndex = Math.floor(Math.pow(Math.random(), 2) * dynaVMCount)
        dynaVMList[Math.min(vmIndex, dynaVMCount - 1)].tasks.push(taskList[i].id)
      }
    }

    // Create tasks based on the paper example for the sample workflow
    const dsawsTaskList: Task[] =
      workflowType === "sample"
        ? [
            {
              id: "t1",
              name: "Task 1",
              runtime: 5, // From the paper: ends at 7, starts at 2
              dependencies: [],
              rank: 31, // From the paper
              completed: false,
              level: 1,
              assignedVM: "vm2", // Pre-assign VM
              startTime: 2, // Pre-assign start time
              endTime: 7, // Pre-assign end time
            },
            {
              id: "t2",
              name: "Task 2",
              runtime: 4, // From the paper: ends at 6, starts at 2
              dependencies: [],
              rank: 32, // From the paper
              completed: false,
              level: 1,
              assignedVM: "vm1", // Pre-assign VM
              startTime: 2, // Pre-assign start time
              endTime: 6, // Pre-assign end time
            },
            {
              id: "t3",
              name: "Task 3",
              runtime: 6, // From the paper: ends at 8, starts at 2
              dependencies: [],
              rank: 30, // From the paper
              completed: false,
              level: 1,
              assignedVM: "vm3", // Pre-assign VM
              startTime: 2, // Pre-assign start time
              endTime: 8, // Pre-assign end time
            },
            {
              id: "t4",
              name: "Task 4",
              runtime: 8, // From the paper: ends at 15, starts at 7
              dependencies: ["t1"],
              rank: 25, // From the paper
              completed: false,
              level: 2,
              assignedVM: "vm2", // Pre-assign VM
              startTime: 7, // Pre-assign start time
              endTime: 15, // Pre-assign end time
            },
            {
              id: "t5",
              name: "Task 5",
              runtime: 9, // From the paper: ends at 15, starts at 6
              dependencies: ["t2"],
              rank: 25, // From the paper
              completed: false,
              level: 2,
              assignedVM: "vm1", // Pre-assign VM
              startTime: 6, // Pre-assign start time
              endTime: 15, // Pre-assign end time
            },
            {
              id: "t6",
              name: "Task 6",
              runtime: 5, // From the paper: ends at 13, starts at 8
              dependencies: ["t3"],
              rank: 20, // From the paper
              completed: false,
              level: 2,
              assignedVM: "vm3", // Pre-assign VM
              startTime: 8, // Pre-assign start time
              endTime: 13, // Pre-assign end time
            },
            {
              id: "t7",
              name: "Task 7",
              runtime: 10, // From the paper: ends at 25, starts at 15
              dependencies: ["t4"],
              rank: 10, // From the paper
              completed: false,
              level: 3,
              assignedVM: "vm2", // Pre-assign VM
              startTime: 15, // Pre-assign start time
              endTime: 25, // Pre-assign end time
            },
            {
              id: "t8",
              name: "Task 8",
              runtime: 14, // From the paper: ends at 29, starts at 15
              dependencies: ["t5"],
              rank: 12, // From the paper
              completed: false,
              level: 3,
              assignedVM: "vm1", // Pre-assign VM
              startTime: 15, // Pre-assign start time
              endTime: 29, // Pre-assign end time
            },
            {
              id: "t9",
              name: "Task 9",
              runtime: 14, // From the paper: ends at 27, starts at 13
              dependencies: ["t6"],
              rank: 14, // From the paper
              completed: false,
              level: 3,
              assignedVM: "vm3", // Pre-assign VM
              startTime: 13, // Pre-assign start time
              endTime: 27, // Pre-assign end time
            },
          ]
        : generateTasks(numTasks, dsawsVMList)

    // Set all state in a single batch
    setDsawsVMs(dsawsVMList)
    setCgaVMs(cgaVMList)
    setDynaVMs(dynaVMList)
    setDsawsTasks(dsawsTaskList)
    setCgaTasks(workflowType === "sample" ? [...dsawsTaskList] : generateTasks(numTasks, cgaVMList))
    setDynaTasks(workflowType === "sample" ? [...dsawsTaskList] : generateTasks(numTasks, dynaVMList))

    // Reset deadline meeting status
    setDsawsMeetsDeadline(true)
    setCgaMeetsDeadline(deadlineFactor >= 1.5)
    setDynaMeetsDeadline(deadlineFactor >= 1.2)
  }

  // Helper function to generate tasks for larger workflows
  const generateTasks = (count: number, vms: VM[]): Task[] => {
    if (workflowType === "sample") {
      return [] // Sample workflow tasks are defined separately
    }

    const tasks: Task[] = []
    const levels = Math.min(10, Math.ceil(Math.sqrt(count / 10))) // Estimate number of levels
    const tasksPerLevel = Math.ceil(count / levels)

    let taskId = 1
    for (let level = 1; level <= levels; level++) {
      const levelTaskCount = Math.min(tasksPerLevel, count - (taskId - 1))
      for (let i = 0; i < levelTaskCount; i++) {
        // Create dependencies to previous level tasks
        const dependencies: string[] = []
        if (level > 1) {
          // Each task depends on 1-3 tasks from the previous level
          const depCount = Math.min(3, tasksPerLevel)
          for (let d = 0; d < depCount; d++) {
            const depLevel = level - 1
            const depIndex = Math.floor(Math.random() * tasksPerLevel) + 1
            const depId = (depLevel - 1) * tasksPerLevel + depIndex
            if (depId < taskId) {
              dependencies.push(`t${depId}`)
            }
          }
        }

        // Calculate runtime based on workflow type
        let runtime = 5
        switch (workflowType) {
          case "montage":
            runtime = Math.floor(Math.random() * 10) + 5 // 5-15 seconds
            break
          case "cybershake":
            runtime = Math.floor(Math.random() * 20) + 10 // 10-30 seconds
            break
          case "ligo":
            runtime = Math.floor(Math.random() * 30) + 15 // 15-45 seconds
            break
          case "epigenomics":
            runtime = Math.floor(Math.random() * 50) + 20 // 20-70 seconds
            break
          default:
            runtime = Math.floor(Math.random() * 10) + 5 // 5-15 seconds
        }

        // Find VM assignment
        const vmIndex = taskId % vms.length
        const assignedVM = vms[vmIndex].id

        // Calculate start and end times (simplified)
        const startTime = level * 5 // Simple estimate
        const endTime = startTime + runtime

        // Add the task
        tasks.push({
          id: `t${taskId}`,
          name: `Task ${taskId}`,
          runtime,
          dependencies,
          rank: count - taskId + 10, // Simple rank calculation
          completed: false,
          level,
          assignedVM,
          startTime,
          endTime,
        })

        taskId++
        if (taskId > count) break
      }
      if (taskId > count) break
    }

    return tasks
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

    // Calculate progress as a percentage of max simulation time
    const progressPercent = Math.min(100, (elapsedTimeRef.current / maxTimeRef.current) * 100)

    // Update algorithm progress based on completed tasks
    const dsawsCompletedTasks = dsawsTasks.filter(
      (task) => elapsedTimeRef.current >= (task.endTime || Number.POSITIVE_INFINITY),
    ).length
    const dsawsProgressPercent = (dsawsCompletedTasks / dsawsTasks.length) * 100
    setDsawsProgress(dsawsProgressPercent)

    // For CGA and Dyna, use simpler progress calculation
    setCgaProgress(Math.min(100, progressPercent))
    setDynaProgress(Math.min(100, progressPercent * 0.9)) // Dyna is slightly slower

    // Update costs
    setDsawsCost(calculateCost(dsawsVMs, elapsedTimeRef.current))
    setCgaCost(calculateCost(cgaVMs, elapsedTimeRef.current))
    setDynaCost(calculateCost(dynaVMs, elapsedTimeRef.current))

    // Check deadline compliance
    if (elapsedTimeRef.current > deadline) {
      if (dsawsProgress < 100) setDsawsMeetsDeadline(false)
      if (cgaProgress < 100) setCgaMeetsDeadline(false)
      if (dynaProgress < 100) setDynaMeetsDeadline(false)
    }

    // Continue animation if not complete
    if (elapsedTimeRef.current < maxTimeRef.current && progressPercent < 100) {
      animationRef.current = requestAnimationFrame(animationFrame)
    } else {
      // Ensure we reach 100% for completed algorithms
      if (dsawsCompletedTasks === dsawsTasks.length) setDsawsProgress(100)
      setCgaProgress(100)
      setDynaProgress(100)

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
      if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && !task.completed) {
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

  const calculateCost = (vms: VM[], time: number) => {
    // Calculate cost based on VM usage time
    return vms.reduce((total, vm) => {
      const usageTime = Math.min(time - vm.startTime, time)
      const usageMinutes = Math.max(1, Math.ceil(usageTime / 60)) // Round up to nearest minute, minimum 1
      return total + vm.cost * usageMinutes
    }, 0)
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

  // Get tasks currently running at a specific time
  const getRunningTasks = (tasks: Task[], time: number) => {
    return tasks.filter((task) => (task.startTime || 0) <= time && (task.endTime || Number.POSITIVE_INFINITY) > time)
  }

  // Get tasks completed at a specific time
  const getCompletedTasks = (tasks: Task[], time: number) => {
    return tasks.filter((task) => (task.endTime || Number.POSITIVE_INFINITY) <= time)
  }

  // Get tasks waiting to start at a specific time
  const getWaitingTasks = (tasks: Task[], time: number) => {
    return tasks.filter((task) => (task.startTime || 0) > time || task.startTime === undefined)
  }

  // Helper function to get task status badge variant
  const getTaskStatusBadge = (taskId: string, algorithm: string, currentTime: number) => {
    let taskList: Task[] = []

    if (algorithm === "DSAWS") taskList = dsawsTasks
    else if (algorithm === "CGA") taskList = cgaTasks
    else if (algorithm === "Dyna") taskList = dynaTasks

    const task = taskList.find((t) => t.id === taskId)

    if (!task) return "outline"

    if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY)) {
      return "success"
    } else if (currentTime >= (task.startTime || 0)) {
      return "default"
    } else {
      return "outline"
    }
  }

  // Function to capture simulation results
  const captureSimulationResults = () => {
    console.log("Capturing simulation results for:", workflowType)

    // Capture DSAWS results
    if (showDSAWS) {
      // Create VM utilization data points
      const dsawsVMUtilization = Array.from({ length: 10 }, (_, i) => {
        const timePoint = (i / 9) * simulationTime
        return {
          time: timePoint,
          vms: dsawsVMs.length, // Simplified - in a real scenario, you'd calculate active VMs at this time
        }
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
        return {
          time: timePoint,
          vms: cgaVMs.length,
        }
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
        return {
          time: timePoint,
          vms: dynaVMs.length,
        }
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

    console.log("Simulation results captured for:", workflowType)
  }

  // Add this useEffect to capture results when simulation completes
  useEffect(() => {
    if (simulationCompleted && !isRunning) {
      console.log("Simulation completed, capturing results")
      captureSimulationResults()
    }
  }, [simulationCompleted, isRunning])

  // Add a more visible indicator that the simulation is running
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Simulation Time: {simulationTime.toFixed(1)}s</span>
              {isRunning && <span className="ml-2 text-green-500 animate-pulse">●</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span>Deadline: {deadline.toFixed(1)}s</span>
            </div>
          </div>

          {/* Fix the tabs implementation */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Task Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="diagram">Workflow Diagram</TabsTrigger>
              <TabsTrigger value="allocation">VM Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {showDSAWS && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-blue-50">
                          DSAWS
                        </Badge>
                        <span className="text-sm">{dsawsProgress.toFixed(2)}% Complete</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Server className="h-4 w-4" />
                          <span className="text-sm">{dsawsVMs.length} VMs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">${dsawsCost.toFixed(4)}</span>
                        </div>
                        <Badge variant={dsawsMeetsDeadline ? "success" : "destructive"}>
                          {dsawsMeetsDeadline ? "Meets Deadline" : "Misses Deadline"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={dsawsProgress} className="h-2" />

                    {/* VM Details Section */}
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-2">DSAWS VM Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dsawsVMs.map((vm) => (
                          <div key={vm.id} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-lg">{vm.id}</div>
                              <Badge variant="outline">{vm.type}</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Speed:</span>
                                <span>{vm.speed} GCEU</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Cost:</span>
                                <span>${vm.cost}/min</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current Time:</span>
                                <span>{vm.currentTime.toFixed(1)}s</span>
                              </div>
                              <div className="mt-2">
                                <span className="text-gray-500">Assigned Tasks:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {vm.tasks.map((taskId) => (
                                    <Badge
                                      key={taskId}
                                      variant={getTaskStatusBadge(taskId, "DSAWS", simulationTime) as any}
                                      className="text-xs"
                                    >
                                      {taskId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {showCGA && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-50">
                          CGA
                        </Badge>
                        <span className="text-sm">{cgaProgress.toFixed(2)}% Complete</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Server className="h-4 w-4" />
                          <span className="text-sm">{cgaVMs.length} VMs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">${cgaCost.toFixed(4)}</span>
                        </div>
                        <Badge variant={cgaMeetsDeadline ? "success" : "destructive"}>
                          {cgaMeetsDeadline ? "Meets Deadline" : "Misses Deadline"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={cgaProgress} className="h-2" />

                    {/* CGA VM Details Section */}
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-2">CGA VM Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cgaVMs.map((vm) => (
                          <div key={vm.id} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-lg">{vm.id}</div>
                              <Badge variant="outline">{vm.type}</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Speed:</span>
                                <span>{vm.speed} GCEU</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Cost:</span>
                                <span>${vm.cost}/min</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current Time:</span>
                                <span>{simulationTime.toFixed(1)}s</span>
                              </div>
                              <div className="mt-2">
                                <span className="text-gray-500">Assigned Tasks:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {vm.tasks.map((taskId) => (
                                    <Badge
                                      key={taskId}
                                      variant={getTaskStatusBadge(taskId, "CGA", simulationTime) as any}
                                      className="text-xs"
                                    >
                                      {taskId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {showDyna && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-purple-50">
                          Dyna
                        </Badge>
                        <span className="text-sm">{dynaProgress.toFixed(2)}% Complete</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Server className="h-4 w-4" />
                          <span className="text-sm">{dynaVMs.length} VMs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">${dynaCost.toFixed(4)}</span>
                        </div>
                        <Badge variant={dynaMeetsDeadline ? "success" : "destructive"}>
                          {dynaMeetsDeadline ? "Meets Deadline" : "Misses Deadline"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={dynaProgress} className="h-2" />

                    {/* Dyna VM Details Section */}
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-2">Dyna VM Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dynaVMs.map((vm) => (
                          <div key={vm.id} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-lg">{vm.id}</div>
                              <Badge variant="outline">{vm.type}</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Speed:</span>
                                <span>{vm.speed} GCEU</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Cost:</span>
                                <span>${vm.cost}/min</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current Time:</span>
                                <span>{simulationTime.toFixed(1)}s</span>
                              </div>
                              <div className="mt-2">
                                <span className="text-gray-500">Assigned Tasks:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {vm.tasks.map((taskId) => (
                                    <Badge
                                      key={taskId}
                                      variant={getTaskStatusBadge(taskId, "Dyna", simulationTime) as any}
                                      className="text-xs"
                                    >
                                      {taskId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
                                <Badge variant="success">Completed</Badge>
                              ) : simulationTime >= (task.startTime || Number.POSITIVE_INFINITY) ? (
                                <Badge>Running</Badge>
                              ) : (
                                <Badge variant="outline">Waiting</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">DSAWS Timeline</h3>
                {/* Use the SVG-based timeline */}
                <TimelineVisualization
                  tasks={dsawsTasks}
                  vms={dsawsVMs}
                  currentTime={simulationTime}
                  maxTime={maxSimulationTime}
                />

                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Task Status</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-medium">Running Tasks</h5>
                      <div className="mt-1 space-y-1">
                        {getRunningTasks(dsawsTasks, simulationTime).map((task) => (
                          <div key={task.id} className="text-xs bg-blue-100 p-1 rounded">
                            {task.id} on {task.assignedVM}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">Completed Tasks</h5>
                      <div className="mt-1 space-y-1">
                        {getCompletedTasks(dsawsTasks, simulationTime).map((task) => (
                          <div key={task.id} className="text-xs bg-green-100 p-1 rounded">
                            {task.id} (finished at {task.endTime}s)
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">Waiting Tasks</h5>
                      <div className="mt-1 space-y-1">
                        {getWaitingTasks(dsawsTasks, simulationTime).map((task) => (
                          <div key={task.id} className="text-xs bg-gray-100 p-1 rounded">
                            {task.id} (starts at {task.startTime}s)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagram">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Workflow Structure</h3>
                {/* Use the SVG-based workflow diagram */}
                <WorkflowDiagram tasks={dsawsTasks} currentTime={simulationTime} />
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Task Ranking</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Tasks are ranked based on their runtime and dependencies. Higher rank values indicate higher
                      priority for scheduling.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Task Dependencies</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Arrows between tasks show dependencies. A task can only start after all its dependencies are
                      completed.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Task Status</h4>
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span className="text-xs">Waiting</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs">Running</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
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
