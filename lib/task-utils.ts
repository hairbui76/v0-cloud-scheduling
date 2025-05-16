import type { Task, VM } from "@/types/simulation"

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

// Distribute tasks among VMs for different algorithms
export const distributeTasks = (
  taskList: Task[],
  dsawsVMList: VM[],
  cgaVMList: VM[],
  dynaVMList: VM[],
  levels: number,
) => {
  const dsawsVMCount = dsawsVMList.length
  const cgaVMCount = cgaVMList.length
  const dynaVMCount = dynaVMList.length

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
