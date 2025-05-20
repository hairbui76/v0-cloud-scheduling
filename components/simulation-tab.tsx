"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import WorkflowSimulation from "@/components/workflow-simulation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSimulation } from "@/context/simulation-context"
import WorkflowDiagram from "@/components/workflow-diagram-simple"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { WorkflowSimulationRef } from "@/types/simulation"

// Add the onSimulationComplete prop to the component props
interface SimulationTabProps {
  onSimulationComplete?: () => void
}

export default function SimulationTab({ onSimulationComplete }: SimulationTabProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState("sample")
  const { setSimulationWorkflowType } = useSimulation()
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [showDSAWS, setShowDSAWS] = useState(true)
  const [showCGA, setShowCGA] = useState(true)
  const [showDyna, setShowDyna] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [deadlineFactor, setDeadlineFactor] = useState(1.5)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [numTasks, setNumTasks] = useState(9) // Default to 9 tasks as in the paper
  const [controlsTab, setControlsTab] = useState("settings")

  // Create a ref to the WorkflowSimulation component
  const simulationRef = useRef<WorkflowSimulationRef>(null)

  const handleStart = () => {
    // If simulation was completed, reset it first
    if (simulationProgress >= 100) {
      handleReset()
      // Small delay to ensure reset is complete before starting
      setTimeout(() => {
        setIsRunning(true)
      }, 50)
    } else {
      setIsRunning(true)
    }
  }

  const handleStop = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    console.log("Reset button clicked")
    setIsRunning(false)
    setSimulationProgress(0)

    // Call the resetSimulation function on the WorkflowSimulation component
    if (simulationRef.current) {
      simulationRef.current.resetSimulation()
    }
  }

  // Add a handler for progress updates
  const handleProgressChange = (progress) => {
    setSimulationProgress(progress)
    // If simulation completes, stop it automatically and call the callback
    if (progress >= 100) {
      setIsRunning(false)
      if (onSimulationComplete) {
        onSimulationComplete()
      }
    }
  }

  const handleTaskCountChange = (value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseInt(value, 10) : value
    if (!isNaN(numValue) && numValue > 0) {
      setNumTasks(numValue)
    }
  }

  // Update the workflow selection handler
  const handleWorkflowChange = (value: string) => {
    setSelectedWorkflow(value)
    setSimulationWorkflowType(value)
  }

  // Set the initial workflow type in the context
  useEffect(() => {
    setSimulationWorkflowType(selectedWorkflow)
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Simulation Controls</CardTitle>
          <CardDescription>Configure and run the simulation to compare scheduling algorithms</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={controlsTab} onValueChange={setControlsTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Simulation Settings</TabsTrigger>
              <TabsTrigger value="diagram">Workflow Diagram</TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Workflow Type</label>
                    <Select value={selectedWorkflow} onValueChange={handleWorkflowChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sample">Sample Workflow (Paper Example)</SelectItem>
                        <SelectItem value="montage">Montage (Astronomy)</SelectItem>
                        <SelectItem value="cybershake">CyberShake (Earthquake Science)</SelectItem>
                        <SelectItem value="ligo">LIGO (Gravitational Physics)</SelectItem>
                        <SelectItem value="epigenomics">Epigenomics (Biology)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Number of Tasks</label>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // This forces the tooltip to stay open on click
                                const tooltip = document.querySelector(
                                  '[data-state="closed"][data-radix-tooltip-content]',
                                )
                                if (tooltip) {
                                  tooltip.setAttribute("data-state", "delayed-open")
                                }
                              }}
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={5} className="max-w-xs">
                            <p>
                              For the sample workflow from the paper, this is fixed at 9 tasks with predefined runtimes
                              and dependencies.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min={9}
                          max={10000}
                          value={numTasks}
                          onChange={(e) => handleTaskCountChange(e.target.value)}
                          className="w-full pr-10"
                          disabled={selectedWorkflow === "sample"}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              disabled={selectedWorkflow === "sample"}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setNumTasks(100)}>100 tasks</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNumTasks(500)}>500 tasks</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNumTasks(1000)}>1000 tasks</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNumTasks(2000)}>2000 tasks</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Deadline Factor</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">1.0</span>
                      <Slider
                        value={[deadlineFactor]}
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        onValueChange={(value) => setDeadlineFactor(value[0])}
                      />
                      <span className="text-sm">2.0</span>
                      <span className="ml-2 text-sm font-medium">{deadlineFactor.toFixed(1)}x</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Simulation Speed</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">0.5x</span>
                      <Slider
                        value={[simulationSpeed]}
                        min={0.5}
                        max={3}
                        step={0.5}
                        onValueChange={(value) => setSimulationSpeed(value[0])}
                      />
                      <span className="text-sm">3x</span>
                      <span className="ml-2 text-sm font-medium">{simulationSpeed.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Toggle Algorithms</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        variant={showDSAWS ? "default" : "outline"}
                        onClick={() => setShowDSAWS(!showDSAWS)}
                        className="flex-1"
                      >
                        DSAWS
                      </Button>
                      <Button
                        variant={showCGA ? "default" : "outline"}
                        onClick={() => setShowCGA(!showCGA)}
                        className="flex-1"
                      >
                        CGA
                      </Button>
                      <Button
                        variant={showDyna ? "default" : "outline"}
                        onClick={() => setShowDyna(!showDyna)}
                        className="flex-1"
                      >
                        Dyna
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={handleStart} disabled={isRunning}>
                        Start
                      </Button>
                      <Button onClick={handleStop} disabled={!isRunning} variant="outline">
                        Stop
                      </Button>
                      <Button onClick={handleReset} variant="outline">
                        Reset
                      </Button>
                    </div>
                  </div>

                  {selectedWorkflow === "sample" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                      <h3 className="text-sm font-medium mb-2">Sample Workflow Information</h3>
                      <p className="text-xs text-gray-600">
                        This is the exact workflow from the DSAWS paper with 9 tasks (t1-t9) scheduled across 3 VMs.
                        Each task has a specific runtime and rank value as defined in the paper.
                      </p>
                      <div className="mt-2 text-xs">
                        <div className="font-medium">Task Runtimes:</div>
                        <ul className="list-disc pl-5 grid grid-cols-2">
                          <li>t1: 5 seconds</li>
                          <li>t2: 4 seconds</li>
                          <li>t3: 6 seconds</li>
                          <li>t4: 8 seconds</li>
                          <li>t5: 9 seconds</li>
                          <li>t6: 5 seconds</li>
                          <li>t7: 10 seconds</li>
                          <li>t8: 14 seconds</li>
                          <li>t9: 14 seconds</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagram">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-4">
                  {selectedWorkflow.charAt(0).toUpperCase() + selectedWorkflow.slice(1)} Workflow Structure
                </h3>
                <WorkflowDiagram workflowType={selectedWorkflow} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <WorkflowSimulation
        ref={simulationRef}
        workflowType={selectedWorkflow}
        isRunning={isRunning}
        simulationSpeed={simulationSpeed}
        showDSAWS={showDSAWS}
        showCGA={showCGA}
        showDyna={showDyna}
        deadlineFactor={deadlineFactor}
        onProgressChange={handleProgressChange}
        numTasks={numTasks}
      />
    </div>
  )
}
