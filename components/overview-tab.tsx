"use client"

import SimulationVMDetails from "@/components/simulation-vm-details"
import type { VM } from "@/types/simulation"

interface OverviewTabProps {
  showDSAWS: boolean
  showCGA: boolean
  showDyna: boolean
  dsawsProgress: number
  cgaProgress: number
  dynaProgress: number
  dsawsVMs: VM[]
  cgaVMs: VM[]
  dynaVMs: VM[]
  dsawsCost: number
  cgaCost: number
  dynaCost: number
  dsawsMeetsDeadline: boolean
  cgaMeetsDeadline: boolean
  dynaMeetsDeadline: boolean
  simulationTime: number
}

export default function OverviewTab({
  showDSAWS,
  showCGA,
  showDyna,
  dsawsProgress,
  cgaProgress,
  dynaProgress,
  dsawsVMs,
  cgaVMs,
  dynaVMs,
  dsawsCost,
  cgaCost,
  dynaCost,
  dsawsMeetsDeadline,
  cgaMeetsDeadline,
  dynaMeetsDeadline,
  simulationTime,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {showDSAWS && (
        <SimulationVMDetails
          algorithm="DSAWS"
          progress={dsawsProgress}
          vms={dsawsVMs}
          cost={dsawsCost}
          meetsDeadline={dsawsMeetsDeadline}
          simulationTime={simulationTime}
        />
      )}

      {showCGA && (
        <SimulationVMDetails
          algorithm="CGA"
          progress={cgaProgress}
          vms={cgaVMs}
          cost={cgaCost}
          meetsDeadline={cgaMeetsDeadline}
          simulationTime={simulationTime}
        />
      )}

      {showDyna && (
        <SimulationVMDetails
          algorithm="Dyna"
          progress={dynaProgress}
          vms={dynaVMs}
          cost={dynaCost}
          meetsDeadline={dynaMeetsDeadline}
          simulationTime={simulationTime}
        />
      )}
    </div>
  )
}
