import type React from "react"
import type { Task, VM } from "@/types/simulation"
import { calculateCost } from "@/lib/vm-types"

// Update task status based on current time
export const updateTaskStatus = (
  currentTime: number,
  dsawsTasksRef: React.MutableRefObject<Task[]>,
  cgaTasksRef: React.MutableRefObject<Task[]>,
  dynaTasksRef: React.MutableRefObject<Task[]>,
  dsawsVMsRef: React.MutableRefObject<VM[]>,
  cgaVMsRef: React.MutableRefObject<VM[]>,
  dynaVMsRef: React.MutableRefObject<VM[]>,
  workflowType: string,
) => {
  // For the sample workflow, we'll use a simplified approach
  if (workflowType === "sample") {
    // Mark tasks as completed based on their end time
    dsawsTasksRef.current = dsawsTasksRef.current.map((task) => {
      if (!task.completed && currentTime >= (task.endTime || 0)) {
        return { ...task, completed: true }
      }
      return task
    })

    cgaTasksRef.current = cgaTasksRef.current.map((task) => {
      if (!task.completed && currentTime >= (task.endTime || 0)) {
        return { ...task, completed: true }
      }
      return task
    })

    dynaTasksRef.current = dynaTasksRef.current.map((task) => {
      if (!task.completed && currentTime >= (task.endTime || 0)) {
        return { ...task, completed: true }
      }
      return task
    })
  } else {
    // For other workflows, use the dependency-based approach
    // First pass: Mark tasks as completed if time has passed and dependencies are completed
    dsawsTasksRef.current = dsawsTasksRef.current.map((task) => {
      // Only process tasks that aren't already completed
      if (!task.completed) {
        // Check if all dependencies are completed
        const dependenciesCompleted = task.dependencies.every((depId) => {
          const depTask = dsawsTasksRef.current.find((t) => t.id === depId)
          return depTask?.completed === true
        })

        // Mark as completed if time has passed AND all dependencies are completed
        if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
          return { ...task, completed: true }
        }
      }
      return task
    })

    // Update CGA tasks with the same logic
    cgaTasksRef.current = cgaTasksRef.current.map((task) => {
      if (!task.completed) {
        const dependenciesCompleted = task.dependencies.every((depId) => {
          const depTask = cgaTasksRef.current.find((t) => t.id === depId)
          return depTask?.completed === true
        })

        if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
          return { ...task, completed: true }
        }
      }
      return task
    })

    // Update Dyna tasks with the same logic
    dynaTasksRef.current = dynaTasksRef.current.map((task) => {
      if (!task.completed) {
        const dependenciesCompleted = task.dependencies.every((depId) => {
          const depTask = dynaTasksRef.current.find((t) => t.id === depId)
          return depTask?.completed === true
        })

        if (currentTime >= (task.endTime || Number.POSITIVE_INFINITY) && dependenciesCompleted) {
          return { ...task, completed: true }
        }
      }
      return task
    })
  }

  // Update VM current times
  dsawsVMsRef.current = dsawsVMsRef.current.map((vm) => {
    // Find the latest task end time for this VM
    const vmTasks = dsawsTasksRef.current.filter((task) => task.assignedVM === vm.id)
    const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)

    return {
      ...vm,
      currentTime: Math.min(currentTime, latestEndTime),
    }
  })

  // Update CGA VMs
  cgaVMsRef.current = cgaVMsRef.current.map((vm) => {
    const vmTasks = cgaTasksRef.current.filter((task) => task.assignedVM === vm.id)
    const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)
    return {
      ...vm,
      currentTime: Math.min(currentTime, latestEndTime),
    }
  })

  // Update Dyna VMs
  dynaVMsRef.current = dynaVMsRef.current.map((vm) => {
    const vmTasks = dynaTasksRef.current.filter((task) => task.assignedVM === vm.id)
    const latestEndTime = Math.max(...vmTasks.map((task) => task.endTime || 0), vm.currentTime)
    return {
      ...vm,
      currentTime: Math.min(currentTime, latestEndTime),
    }
  })
}

// Force complete all tasks - used as a fallback
export const forceCompleteAllTasks = (
  dsawsTasksRef: React.MutableRefObject<Task[]>,
  cgaTasksRef: React.MutableRefObject<Task[]>,
  dynaTasksRef: React.MutableRefObject<Task[]>,
  setDsawsTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setCgaTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setDynaTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setDsawsProgress: React.Dispatch<React.SetStateAction<number>>,
  setCgaProgress: React.Dispatch<React.SetStateAction<number>>,
  setDynaProgress: React.Dispatch<React.SetStateAction<number>>,
) => {
  // Update refs first
  dsawsTasksRef.current = dsawsTasksRef.current.map((task) => ({ ...task, completed: true }))
  cgaTasksRef.current = cgaTasksRef.current.map((task) => ({ ...task, completed: true }))
  dynaTasksRef.current = dynaTasksRef.current.map((task) => ({ ...task, completed: true }))

  // Then update state (this will be batched)
  setDsawsTasks([...dsawsTasksRef.current])
  setCgaTasks([...cgaTasksRef.current])
  setDynaTasks([...dynaTasksRef.current])

  // Set progress to 100%
  setDsawsProgress(100)
  setCgaProgress(100)
  setDynaProgress(100)
}

// Calculate progress and costs
export const calculateProgressAndCosts = (
  dsawsTasksRef: React.MutableRefObject<Task[]>,
  cgaTasksRef: React.MutableRefObject<Task[]>,
  dynaTasksRef: React.MutableRefObject<Task[]>,
  dsawsVMsRef: React.MutableRefObject<VM[]>,
  cgaVMsRef: React.MutableRefObject<VM[]>,
  dynaVMsRef: React.MutableRefObject<VM[]>,
  elapsedTimeRef: React.MutableRefObject<number>,
) => {
  // Calculate progress based on completed tasks
  const dsawsCompletedTasks = dsawsTasksRef.current.filter((task) => task.completed).length
  const dsawsProgressPercent =
    dsawsTasksRef.current.length > 0 ? (dsawsCompletedTasks / dsawsTasksRef.current.length) * 100 : 100

  const cgaCompletedTasks = cgaTasksRef.current.filter((task) => task.completed).length
  const cgaProgressPercent =
    cgaTasksRef.current.length > 0 ? (cgaCompletedTasks / cgaTasksRef.current.length) * 100 : 100

  const dynaCompletedTasks = dynaTasksRef.current.filter((task) => task.completed).length
  const dynaProgressPercent =
    dynaTasksRef.current.length > 0 ? (dynaCompletedTasks / dynaTasksRef.current.length) * 100 : 100

  // Calculate costs
  const dsawsCostValue = calculateCost(dsawsVMsRef.current, elapsedTimeRef.current)
  const cgaCostValue = calculateCost(cgaVMsRef.current, elapsedTimeRef.current)
  const dynaCostValue = calculateCost(dynaVMsRef.current, elapsedTimeRef.current)

  return {
    dsawsProgress: dsawsCompletedTasks === dsawsTasksRef.current.length ? 100 : dsawsProgressPercent,
    cgaProgress: cgaCompletedTasks === cgaTasksRef.current.length ? 100 : cgaProgressPercent,
    dynaProgress: dynaCompletedTasks === dynaTasksRef.current.length ? 100 : dynaProgressPercent,
    dsawsCost: dsawsCostValue,
    cgaCost: cgaCostValue,
    dynaCost: dynaCostValue,
    dsawsAllCompleted: dsawsCompletedTasks === dsawsTasksRef.current.length && dsawsTasksRef.current.length > 0,
    cgaAllCompleted: cgaCompletedTasks === cgaTasksRef.current.length && cgaTasksRef.current.length > 0,
    dynaAllCompleted: dynaCompletedTasks === dynaTasksRef.current.length && dynaTasksRef.current.length > 0,
  }
}
