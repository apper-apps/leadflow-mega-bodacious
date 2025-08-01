import tasksData from "@/services/mockData/tasks.json";

let tasks = [...tasksData];

// Utility function to simulate API delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const taskService = {
  // Get all tasks
  async getAll() {
    await delay(300);
    return tasks.map(task => ({ ...task }));
  },

  // Get task by ID
  async getById(id) {
    await delay(200);
    const task = tasks.find(task => task.Id === parseInt(id));
    if (!task) {
      throw new Error("Task not found");
    }
    return { ...task };
  },

  // Get tasks by lead ID
  async getByLeadId(leadId) {
    await delay(200);
    return tasks
      .filter(task => task.leadId === parseInt(leadId))
      .map(task => ({ ...task }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get pending tasks
  async getPending() {
    await delay(200);
    const now = new Date().toISOString();
    return tasks
      .filter(task => task.status === 'pending')
      .map(task => {
        const taskCopy = { ...task };
        // Check if task is overdue
        if (new Date(taskCopy.dueDate) < new Date(now)) {
          taskCopy.status = 'overdue';
        }
        return taskCopy;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // Get overdue tasks
  async getOverdue() {
    await delay(200);
    const now = new Date().toISOString();
    return tasks
      .filter(task => task.status === 'pending' && new Date(task.dueDate) < new Date(now))
      .map(task => ({ ...task, status: 'overdue' }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // Create new task
  async create(taskData) {
    await delay(400);
    const maxId = Math.max(...tasks.map(task => task.Id), 0);
    const newTask = {
      Id: maxId + 1,
      ...taskData,
      leadId: parseInt(taskData.leadId),
      status: "pending",
      completedDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.push(newTask);
    return { ...newTask };
  },

  // Update task
  async update(id, taskData) {
    await delay(300);
    const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...taskData,
      leadId: taskData.leadId ? parseInt(taskData.leadId) : tasks[taskIndex].leadId,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;
    return { ...updatedTask };
  },

  // Mark task as complete
  async markComplete(id) {
    await delay(200);
    const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: "completed",
      completedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { ...tasks[taskIndex] };
  },

  // Mark task as pending
  async markPending(id) {
    await delay(200);
    const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: "pending",
      completedDate: null,
      updatedAt: new Date().toISOString()
    };

    return { ...tasks[taskIndex] };
  },

  // Delete task
  async delete(id) {
    await delay(300);
    const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    return { ...deletedTask };
  },

  // Get task statistics
  async getStats() {
    await delay(200);
    const now = new Date().toISOString();
    
    const pending = tasks.filter(task => task.status === 'pending').length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const overdue = tasks.filter(task => 
      task.status === 'pending' && new Date(task.dueDate) < new Date(now)
    ).length;
    const total = tasks.length;

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  },

  // Search tasks
  async search(query, filters = {}) {
    await delay(300);
    let filteredTasks = [...tasks];

    // Apply text search
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'overdue') {
        const now = new Date().toISOString();
        filteredTasks = filteredTasks.filter(task =>
          task.status === 'pending' && new Date(task.dueDate) < new Date(now)
        );
      } else {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      }
    }

    if (filters.type && filters.type !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.type === filters.type);
    }

    if (filters.priority && filters.priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.leadId) {
      filteredTasks = filteredTasks.filter(task => task.leadId === parseInt(filters.leadId));
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredTasks.sort((a, b) => {
        switch (filters.sortBy) {
          case 'dueDate':
            return new Date(a.dueDate) - new Date(b.dueDate);
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          case 'created':
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      });
    }

    return filteredTasks.map(task => {
      const taskCopy = { ...task };
      // Check if task is overdue
      if (task.status === 'pending' && new Date(task.dueDate) < new Date()) {
        taskCopy.status = 'overdue';
      }
      return taskCopy;
    });
  }
};