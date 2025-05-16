"use client"

import AllocationComparison from "@/components/allocation-comparison"
import TaskAllocationVisualization from "@/components/task-allocation-visualization"
import type { Task, VM } from "@/types/simulation"

interface AllocationTabProps {
  dsawsVMs: VM[]
  cgaVMs: VM[]
  dynaVMs: VM[]
  dsawsTasks: Task[]
  cgaTasks: Task[]
  dynaTasks: Task[]
  showDSAWS: boolean
  showCGA: boolean
  showDyna: boolean
}

export default function AllocationTab({
  dsawsVMs,
  cgaVMs,
  dynaVMs,
  dsawsTasks,
  cgaTasks,
  dynaTasks,
  showDSAWS,
  showCGA,
  showDyna,
}: AllocationTabProps) {
  return (
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
  )
}
