import type { VM } from "@/types/simulation"

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
      // DSAWS is structure-aware and analyzes workflow structure
      // It assigns VMs based on task criticality and rank
      // Tasks are ranked by their position in the workflow structure
      const taskRank = calculateTaskRank(taskIndex, totalTasks, workflowType)

      // Critical tasks (high rank) get faster VMs
      if (taskRank > 0.8) {
        return vmTypes[Math.min(maxVMTypeIndex, 4)]
      } else if (taskRank > 0.5) {
        return vmTypes[Math.min(maxVMTypeIndex, 3)]
      } else if (taskRank > 0.3) {
        return vmTypes[Math.min(maxVMTypeIndex, 2)]
      } else {
        return vmTypes[Math.min(maxVMTypeIndex, 1)]
      }

    case "CGA":
      // CGA uses genetic algorithm with adaptive penalty function
      // It generates initial population based on critical path
      // For simulation, we'll use a deterministic approach based on task position

      // Calculate task position in workflow (normalized)
      const normalizedPosition = taskIndex / totalTasks

      // Determine VM type based on workflow type and position
      if (workflowType === "montage") {
        // Montage has many parallel tasks, use more varied VM types
        if (normalizedPosition < 0.2) {
          return vmTypes[Math.min(maxVMTypeIndex, 3)]
        } else if (normalizedPosition < 0.6) {
          return vmTypes[Math.min(maxVMTypeIndex, 2)]
        } else {
          return vmTypes[Math.min(maxVMTypeIndex, 1)]
        }
      } else if (workflowType === "cybershake") {
        // CyberShake has intense parallelism in middle levels
        if (normalizedPosition > 0.3 && normalizedPosition < 0.7) {
          return vmTypes[Math.min(maxVMTypeIndex, 3)]
        } else {
          return vmTypes[Math.min(maxVMTypeIndex, 2)]
        }
      } else if (workflowType === "ligo") {
        // LIGO has CPU-intensive tasks with runtime variations
        if (normalizedPosition < 0.5) {
          return vmTypes[Math.min(maxVMTypeIndex, 3)]
        } else {
          return vmTypes[Math.min(maxVMTypeIndex, 2)]
        }
      } else if (workflowType === "epigenomics") {
        // Epigenomics has extreme runtime variations
        if (normalizedPosition > 0.4 && normalizedPosition < 0.6) {
          return vmTypes[Math.min(maxVMTypeIndex, 4)] // Critical middle section
        } else {
          return vmTypes[Math.min(maxVMTypeIndex, 2)]
        }
      } else {
        return vmTypes[Math.min(maxVMTypeIndex, 2)]
      }

    case "Dyna":
      // Dyna uses A*-based instance configuration
      // It considers both performance and price dynamics
      // For simulation, we'll use a probabilistic approach

      // Calculate task importance based on workflow type
      const taskImportance = calculateTaskImportance(taskIndex, totalTasks, workflowType)

      // Select VM type based on task importance
      if (taskImportance > 0.8) {
        // Critical tasks get more powerful VMs
        return vmTypes[Math.min(maxVMTypeIndex, 4)]
      } else if (taskImportance > 0.6) {
        return vmTypes[Math.min(maxVMTypeIndex, 3)]
      } else if (taskImportance > 0.4) {
        return vmTypes[Math.min(maxVMTypeIndex, 2)]
      } else {
        // Less important tasks get less powerful VMs
        return vmTypes[Math.min(maxVMTypeIndex, 1)]
      }

    default:
      return vmTypes[1] // Default to n1-standard-2
  }
}

// Helper function to calculate task rank for DSAWS
const calculateTaskRank = (taskIndex: number, totalTasks: number, workflowType: string): number => {
  // Different workflows have different critical paths and structures
  if (workflowType === "montage") {
    // Montage has 9 levels with single-threaded tasks in 6 levels
    // Tasks in levels 3-4 and 6-9 are more critical
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex < 0.1 || (normalizedIndex > 0.4 && normalizedIndex < 0.6)) {
      return 0.9 // Critical tasks
    } else if (normalizedIndex > 0.8) {
      return 0.7 // Important final tasks
    } else {
      return 0.3 // Less critical tasks
    }
  } else if (workflowType === "cybershake") {
    // CyberShake has intense parallelism in middle levels (2-3)
    // These levels contain 99% of tasks
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex > 0.1 && normalizedIndex < 0.9) {
      return 0.8 // Critical middle section
    } else {
      return 0.4 // Less critical tasks
    }
  } else if (workflowType === "ligo") {
    // LIGO has CPU-intensive tasks with runtime variations
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex < 0.3) {
      return 0.9 // Critical initial tasks
    } else if (normalizedIndex > 0.7) {
      return 0.8 // Critical final tasks
    } else {
      return 0.5 // Medium importance tasks
    }
  } else if (workflowType === "epigenomics") {
    // Epigenomics has extreme runtime variations
    // Level 5 contains 245 tasks that account for 99.8% of execution time
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex > 0.4 && normalizedIndex < 0.6) {
      return 0.95 // Extremely critical middle section
    } else if (normalizedIndex < 0.2 || normalizedIndex > 0.8) {
      return 0.4 // Less critical tasks
    } else {
      return 0.6 // Medium importance tasks
    }
  } else {
    // Default ranking for other workflows
    return taskIndex / totalTasks
  }
}

// Helper function to calculate task importance for Dyna
const calculateTaskImportance = (taskIndex: number, totalTasks: number, workflowType: string): number => {
  // Dyna considers probabilistic performance guarantees
  // Different workflows have different critical tasks
  if (workflowType === "montage") {
    // Montage is more sensitive to data transfer
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex < 0.2) {
      return 0.9 // Initial tasks are important
    } else if (normalizedIndex > 0.8) {
      return 0.8 // Final tasks are important
    } else {
      return 0.5 // Middle tasks are less critical
    }
  } else if (workflowType === "cybershake") {
    // CyberShake has data transfer bottlenecks
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex > 0.2 && normalizedIndex < 0.8) {
      return 0.7 // Middle tasks are important
    } else {
      return 0.5 // Other tasks are less critical
    }
  } else if (workflowType === "ligo") {
    // LIGO has CPU-intensive tasks
    const normalizedIndex = taskIndex / totalTasks
    // Tasks with runtime variations need more powerful VMs
    return 0.4 + Math.sin(normalizedIndex * Math.PI) * 0.5
  } else if (workflowType === "epigenomics") {
    // Epigenomics has extreme runtime variations
    const normalizedIndex = taskIndex / totalTasks
    if (normalizedIndex > 0.4 && normalizedIndex < 0.6) {
      return 0.9 // Critical middle section
    } else {
      return 0.4 // Other tasks are less critical
    }
  } else {
    // Default importance for other workflows
    return 0.5
  }
}

// Calculate cost based on VM usage time
export const calculateCost = (vms: VM[], time: number) => {
  return vms.reduce((total, vm) => {
    const usageTime = Math.min(time - vm.startTime, time)
    const usageMinutes = Math.max(1, Math.ceil(usageTime / 60)) // Round up to nearest minute, minimum 1
    return total + vm.cost * usageMinutes
  }, 0)
}
