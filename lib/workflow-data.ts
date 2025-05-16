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

// Sample workflow tasks based on the DSAWS paper
export const getSampleWorkflowTasks = () => [
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
