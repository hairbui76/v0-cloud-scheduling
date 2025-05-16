import type { Task, VM } from "@/types/simulation"
import { vmTypes, selectVMType, calculateCost } from "@/lib/vm-types"
import { getSampleWorkflowTasks } from "@/lib/workflow-data"
import { generateTasks, distributeTasks } from "@/lib/task-utils"

// Initialize simulation based on workflow type
export const initializeSimulation = (
  workflowType: string,
  numTasks: number,
  deadlineFactor: number,
  isInitialized: boolean,
) => {
  // Skip if already initialized and not forcing reinitialization
  if (isInitialized) {
    return {
      dsawsVMs: [],
      cgaVMs: [],
      dynaVMs: [],
      dsawsTasks: [],
      cgaTasks: [],
      dynaTasks: [],
    }
  }

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
        : selectVMType("DSAWS", i, dsawsVMCount, workflowType)

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
        : selectVMType("CGA", i, cgaVMCount, workflowType)

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
        : selectVMType("Dyna", i, dynaVMCount, workflowType)

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
          runtime: 0, // Will be set later
          dependencies,
          rank: 0, // Will be set later
          completed: false,
          level,
        })

        taskId++
        if (taskId > numTasks) break
      }
      if (taskId > numTasks) break
    }

    // Distribute tasks among VMs for each algorithm
    distributeTasks(taskList, dsawsVMList, cgaVMList, dynaVMList, levels)
  }

  // Create tasks based on the paper example for the sample workflow
  const dsawsTaskList: Task[] =
    workflowType === "sample" ? getSampleWorkflowTasks() : generateTasks(numTasks, dsawsVMList, workflowType, "DSAWS")

  // For CGA and Dyna, create tasks with different characteristics
  const cgaTaskList: Task[] =
    workflowType === "sample"
      ? modifySampleWorkflowForAlgorithm(getSampleWorkflowTasks(), "CGA")
      : generateTasks(numTasks, cgaVMList, workflowType, "CGA")

  const dynaTaskList: Task[] =
    workflowType === "sample"
      ? modifySampleWorkflowForAlgorithm(getSampleWorkflowTasks(), "Dyna")
      : generateTasks(numTasks, dynaVMList, workflowType, "Dyna")

  return {
    dsawsVMs: dsawsVMList,
    cgaVMs: cgaVMList,
    dynaVMs: dynaVMList,
    dsawsTasks: dsawsTaskList,
    cgaTasks: cgaTaskList,
    dynaTasks: dynaTaskList,
  }
}

// Helper function to modify sample workflow tasks for different algorithms
function modifySampleWorkflowForAlgorithm(tasks: Task[], algorithm: string): Task[] {
  // Create a deep copy of the tasks
  const modifiedTasks = JSON.parse(JSON.stringify(tasks)) as Task[]

  // Apply algorithm-specific modifications
  const algorithmFactors = {
    CGA: {
      runtimeMultiplier: 1.2,
      startTimeOffset: 1,
    },
    Dyna: {
      runtimeMultiplier: 1.1,
      startTimeOffset: 0.5,
    },
    DSAWS: {
      runtimeMultiplier: 1.0,
      startTimeOffset: 0,
    },
  }

  const factor = algorithmFactors[algorithm] || algorithmFactors.DSAWS

  // Modify each task
  return modifiedTasks.map((task) => {
    // Adjust runtime
    const newRuntime = Math.ceil(task.runtime * factor.runtimeMultiplier)

    // Adjust start and end times
    const newStartTime = task.startTime + factor.startTimeOffset
    const newEndTime = newStartTime + newRuntime

    return {
      ...task,
      runtime: newRuntime,
      startTime: newStartTime,
      endTime: newEndTime,
    }
  })
}

// Re-export calculateCost for convenience
export { calculateCost }
