import type { Task, VM } from "@/types/simulation"

// VM types based on Google Compute Engine
export const vmTypes = [
  { name: "n1-standard-1", speed: 1, cost: 0.00105 },
  { name: "n1-standard-2", speed: 2, cost: 0.0021 },
  { name: "n1-standard-4", speed: 4, cost: 0.0042 },
  { name: "n1-standard-8", speed: 8, cost: 0.0084 },
  { name: "n1-standard-16", speed: 16, cost: 0.0168 },
  { name: "n1-standard-32", speed: 32, cost: 0.0336 },
  { name: "n1-standard-64", speed: 64, cost: 0.0672 },
]

// Workflow data
export const workflowData = {
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

// Helper function to select VM type based on algorithm and task characteristics
export const selectVMType = (algorithm: string, taskIndex: number, totalTasks: number, workflowType: string) => {
  // For the sample workflow, use n1-standard-2 for all VMs
  if (workflowType === "sample") {
    return vmTypes[1] // n1-standard-2
  }

  // Calculate how many VM types to use based on task count
  // More tasks = more variety in VM types
  const maxVMTypeIndex = Math.min(vmTypes.length - 1, Math.max(1, Math.floor(Math.log2(totalTasks / 10))))

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

// Initialize simulation based on workflow type
export const initializeSimulation = (
  workflowType: string,
  numTasks: number,
  deadlineFactor: number,
  isInitialized: boolean,
) => {
  // Skip if already initialized
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

  return {
    dsawsVMs: dsawsVMList,
    cgaVMs: cgaVMList,
    dynaVMs: dynaVMList,
    dsawsTasks: dsawsTaskList,
    cgaTasks: workflowType === "sample" ? [...dsawsTaskList] : generateTasks(numTasks, cgaVMList),
    dynaTasks: workflowType === "sample" ? [...dsawsTaskList] : generateTasks(numTasks, dynaVMList),
  }
}

// Helper function to generate tasks for larger workflows
export const generateTasks = (count: number, vms: VM[]): Task[] => {
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
      const workflowType = "sample" // Default
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

// Calculate cost based on VM usage time
export const calculateCost = (vms: VM[], time: number) => {
  return vms.reduce((total, vm) => {
    const usageTime = Math.min(time - vm.startTime, time)
    const usageMinutes = Math.max(1, Math.ceil(usageTime / 60)) // Round up to nearest minute, minimum 1
    return total + vm.cost * usageMinutes
  }, 0)
}
