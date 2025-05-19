import type { Task, VM } from "@/types/simulation"
import { workflowData } from "@/lib/workflow-data"

// Helper function to generate tasks for larger workflows
export const generateTasks = (count: number, vms: VM[], workflowType = "sample", algorithm = "DSAWS"): Task[] => {
  const tasks: Task[] = []

  // Get workflow-specific data
  const workflow = workflowData[workflowType] || workflowData.sample
  const maxRank = workflow.maxRank
  const meanRuntime = workflow.meanRuntime
  const levels = Math.min(workflow.levels, Math.ceil(Math.sqrt(count / 10)))
  const tasksPerLevel = Math.ceil(count / levels)

  // Runtime variation factors based on workflow type
  const runtimeVariationFactors = {
    montage: { min: 0.5, max: 2.0 }, // Moderate variation
    cybershake: { min: 0.7, max: 3.0 }, // Higher variation
    ligo: { min: 0.3, max: 3.0 }, // Large variation (factor of 3)
    epigenomics: { min: 0.01, max: 7000.0 }, // Extreme variation (factor of 7000)
    sample: { min: 0.8, max: 1.2 }, // Low variation
  }

  // Get variation factor for the current workflow type
  const variationFactor = runtimeVariationFactors[workflowType] || runtimeVariationFactors.sample

  // Level-specific runtime multipliers to match workflow characteristics
  const levelRuntimeMultipliers = getLevelRuntimeMultipliers(workflowType, levels)

  // Algorithm-specific efficiency factors
  // These represent how efficiently each algorithm schedules tasks
  const algorithmEfficiencyFactors = {
    DSAWS: 1.0, // Baseline efficiency
    CGA: 1.2, // CGA is less efficient (takes 20% longer)
    Dyna: 1.1, // Dyna is slightly less efficient than DSAWS but better than CGA
  }

  // Get the efficiency factor for the current algorithm
  const efficiencyFactor = algorithmEfficiencyFactors[algorithm] || 1.0

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

      // Calculate runtime based on workflow type and level
      // Base runtime is the mean runtime for the workflow type
      const levelMultiplier = levelRuntimeMultipliers[level - 1] || 1

      // Add variation within the level
      const variationMultiplier = variationFactor.min + Math.random() * (variationFactor.max - variationFactor.min)

      // Calculate final runtime with algorithm efficiency factor
      let runtime = Math.max(1, Math.round(meanRuntime * levelMultiplier * variationMultiplier * efficiencyFactor))

      // For epigenomics, level 5 has extremely long runtimes
      if (workflowType === "epigenomics" && level === 5) {
        runtime = Math.max(runtime, Math.round(meanRuntime * 5 * efficiencyFactor))
      }

      // Calculate rank based on runtime and level
      // Higher levels and longer runtimes = higher rank
      const rankFactor = (levels - level + 1) / levels // Higher levels have lower rank factor
      const rank = Math.round(maxRank * rankFactor * (runtime / meanRuntime) * 0.8)

      // Find VM assignment
      const vmIndex = taskId % vms.length
      const assignedVM = vms[vmIndex].id

      // Calculate start and end times based on algorithm
      // Different algorithms have different scheduling strategies
      let startTime = level * 5 // Simple estimate

      // Adjust start times based on algorithm
      if (algorithm === "CGA") {
        // CGA tends to have more gaps between tasks
        startTime = level * 6
      } else if (algorithm === "Dyna") {
        // Dyna has a different scheduling pattern
        startTime = level * 5.5
      }

      const endTime = startTime + runtime

      // Add the task
      tasks.push({
        id: `t${taskId}`,
        name: `Task ${taskId}`,
        runtime,
        dependencies,
        rank: Math.max(1, rank), // Ensure rank is at least 1
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

// Helper function to get level-specific runtime multipliers
function getLevelRuntimeMultipliers(workflowType: string, levels: number): number[] {
  switch (workflowType) {
    case "montage":
      // Montage has fairly uniform levels with a few critical path tasks
      return Array(levels)
        .fill(1)
        .map((_, i) => (i === Math.floor(levels / 2) ? 1.5 : 1))

    case "cybershake":
      // CyberShake has intense parallelism in middle levels
      return Array(levels)
        .fill(1)
        .map((_, i) => {
          const normalizedLevel = i / (levels - 1)
          // Middle levels (2-3) have higher runtimes
          return normalizedLevel > 0.2 && normalizedLevel < 0.6 ? 1.8 : 0.8
        })

    case "ligo":
      // LIGO has increasing runtimes in later levels
      return Array(levels)
        .fill(1)
        .map((_, i) => {
          const normalizedLevel = i / (levels - 1)
          // Runtime increases with level
          return 0.7 + normalizedLevel * 0.6
        })

    case "epigenomics":
      // Epigenomics has extreme runtime variations with level 5 being critical
      return Array(levels)
        .fill(1)
        .map((_, i) => {
          // Level 5 (index 4) has extremely long runtimes
          if (i === 4 || (levels < 6 && i === Math.floor(levels * 0.6))) {
            return 100 // Extreme runtime for level 5
          }
          return 0.5 + Math.random() * 0.5 // Other levels have moderate runtimes
        })

    case "sample":
      // Sample workflow has predefined runtimes
      return [1, 1.2, 1.4]

    default:
      return Array(levels).fill(1)
  }
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
  // and assigns higher-ranked tasks to faster VMs
  const dsawsTasksByRank = [...taskList].sort((a, b) => b.rank - a.rank)

  // Assign tasks to VMs based on rank and dependencies
  dsawsTasksByRank.forEach((task, index) => {
    // For high-rank tasks, prefer faster VMs
    const vmIndex = index < dsawsVMCount ? index : index % dsawsVMCount
    dsawsVMList[vmIndex].tasks.push(task.id)
  })

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
