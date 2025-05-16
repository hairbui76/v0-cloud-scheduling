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

// Calculate cost based on VM usage time
export const calculateCost = (vms: VM[], time: number) => {
  return vms.reduce((total, vm) => {
    const usageTime = Math.min(time - vm.startTime, time)
    const usageMinutes = Math.max(1, Math.ceil(usageTime / 60)) // Round up to nearest minute, minimum 1
    return total + vm.cost * usageMinutes
  }, 0)
}
