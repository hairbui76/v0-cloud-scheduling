// Static algorithm comparison data (fallback when no simulation results are available)
export const algorithmData = {
  montage: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 100 },
      { factor: "1.5", DSAWS: 100, CGA: 100, Dyna: 100 },
      { factor: "2.0", DSAWS: 100, CGA: 100, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 0.12, CGA: 0.18, Dyna: 0.25 },
      { factor: "1.5", DSAWS: 0.08, CGA: 0.12, Dyna: 0.18 },
      { factor: "2.0", DSAWS: 0.06, CGA: 0.09, Dyna: 0.15 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 2, CGA: 3, Dyna: 2 },
      { time: "25", DSAWS: 3, CGA: 5, Dyna: 4 },
      { time: "50", DSAWS: 3, CGA: 6, Dyna: 5 },
      { time: "75", DSAWS: 2, CGA: 6, Dyna: 5 },
      { time: "100", DSAWS: 2, CGA: 4, Dyna: 3 },
      { time: "125", DSAWS: 1, CGA: 3, Dyna: 2 },
      { time: "150", DSAWS: 1, CGA: 2, Dyna: 2 },
      { time: "175", DSAWS: 1, CGA: 1, Dyna: 1 },
    ],
  },
  cybershake: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 0, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 1.2, CGA: 2.1, Dyna: 2.5 },
      { factor: "1.5", DSAWS: 0.8, CGA: 1.5, Dyna: 1.8 },
      { factor: "2.0", DSAWS: 0.6, CGA: 1.2, Dyna: 1.5 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 3, CGA: 4, Dyna: 3 },
      { time: "100", DSAWS: 5, CGA: 8, Dyna: 7 },
      { time: "200", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "300", DSAWS: 10, CGA: 15, Dyna: 12 },
      { time: "400", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "500", DSAWS: 5, CGA: 8, Dyna: 7 },
      { time: "600", DSAWS: 3, CGA: 5, Dyna: 4 },
      { time: "700", DSAWS: 1, CGA: 2, Dyna: 2 },
    ],
  },
  ligo: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 0, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 2.5, CGA: 4.2, Dyna: 5.1 },
      { factor: "1.5", DSAWS: 1.8, CGA: 3.5, Dyna: 4.2 },
      { factor: "2.0", DSAWS: 1.2, CGA: 2.8, Dyna: 3.5 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 4, CGA: 5, Dyna: 4 },
      { time: "100", DSAWS: 6, CGA: 8, Dyna: 7 },
      { time: "200", DSAWS: 8, CGA: 10, Dyna: 9 },
      { time: "300", DSAWS: 8, CGA: 10, Dyna: 9 },
      { time: "400", DSAWS: 6, CGA: 8, Dyna: 7 },
      { time: "500", DSAWS: 4, CGA: 6, Dyna: 5 },
      { time: "600", DSAWS: 2, CGA: 3, Dyna: 3 },
    ],
  },
  epigenomics: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "1.5", DSAWS: 100, CGA: 0, Dyna: 0 },
      { factor: "2.0", DSAWS: 100, CGA: 100, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 80, CGA: 120, Dyna: 140 },
      { factor: "1.5", DSAWS: 60, CGA: 90, Dyna: 110 },
      { factor: "2.0", DSAWS: 40, CGA: 70, Dyna: 90 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 5, CGA: 7, Dyna: 6 },
      { time: "5000", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "10000", DSAWS: 12, CGA: 18, Dyna: 15 },
      { time: "15000", DSAWS: 15, CGA: 22, Dyna: 18 },
      { time: "20000", DSAWS: 12, CGA: 18, Dyna: 15 },
      { time: "25000", DSAWS: 8, CGA: 12, Dyna: 10 },
      { time: "30000", DSAWS: 3, CGA: 5, Dyna: 4 },
    ],
  },
  sample: {
    deadlineSuccess: [
      { factor: "1.0", DSAWS: 50, CGA: 25, Dyna: 75 },
      { factor: "1.5", DSAWS: 75, CGA: 50, Dyna: 90 },
      { factor: "2.0", DSAWS: 90, CGA: 75, Dyna: 100 },
    ],
    executionCost: [
      { factor: "1.0", DSAWS: 10, CGA: 15, Dyna: 20 },
      { factor: "1.5", DSAWS: 8, CGA: 12, Dyna: 16 },
      { factor: "2.0", DSAWS: 6, CGA: 9, Dyna: 12 },
    ],
    vmUtilization: [
      { time: "0", DSAWS: 1, CGA: 2, Dyna: 1 },
      { time: "50", DSAWS: 2, CGA: 3, Dyna: 2 },
      { time: "100", DSAWS: 3, CGA: 4, Dyna: 3 },
    ],
  },
}

// Algorithm descriptions
export const algorithmDescriptions = {
  DSAWS: {
    name: "Deadline and Structure-Aware Workflow Scheduler (DSAWS)",
    description:
      "A heuristic algorithm that analyzes workflow structure to determine the type and number of VMs to deploy and when to provision/de-provision them.",
    strengths: [
      "Analyzes workflow structure to make informed scheduling decisions",
      "Considers VM provisioning/de-provisioning delays",
      "Minimizes data transfer by assigning related tasks to the same VM",
      "Uses leftover time in billing periods to avoid wasting resources",
      "Highly effective at meeting deadlines while minimizing costs",
    ],
    weaknesses: [
      "Static scheduling approach may not adapt to unexpected runtime variations",
      "Requires detailed workflow structure analysis upfront",
    ],
  },
  CGA: {
    name: "Coevolutionary Genetic Algorithm (CGA)",
    description:
      "A genetic algorithm that uses adaptive penalty function for strict constraints and adjusts crossover and mutation probability to accelerate convergence.",
    strengths: [
      "Uses adaptive penalty function for handling constraints",
      "Adjusts crossover and mutation probabilities to accelerate convergence",
      "Generates initial population based on critical path",
      "Can find near-optimal solutions for complex scheduling problems",
    ],
    weaknesses: [
      "Computationally intensive, especially for large workflows",
      "May struggle with strict deadline constraints",
      "Doesn't consider VM provisioning/de-provisioning delays",
      "Less effective at minimizing data transfer costs",
    ],
  },
  Dyna: {
    name: "Dyna",
    description:
      "A probabilistic scheduling system that minimizes monetary cost while satisfying probabilistic deadline guarantees.",
    strengths: [
      "Uses A*-based instance configuration for performance dynamics",
      "Hybrid instance configuration refinement for spot instances",
      "Handles cloud performance and price dynamics",
      "Offers probabilistic performance guarantees",
    ],
    weaknesses: [
      "May over-provision resources to ensure deadline compliance",
      "Less effective at minimizing data transfer costs",
      "Complex implementation with multiple optimization steps",
      "May struggle with workflows having extreme runtime variations",
    ],
  },
}
