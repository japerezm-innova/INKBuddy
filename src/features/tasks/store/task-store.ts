import { create } from 'zustand'
import type { Task, TaskCategory } from '../types/task'

interface TaskStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  updateTaskLocally: (id: string, updates: Partial<Task>) => void
  addTaskLocally: (task: Task) => void
  removeTaskLocally: (id: string) => void
  filterCategory: TaskCategory | null
  setFilterCategory: (cat: TaskCategory | null) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  updateTaskLocally: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  addTaskLocally: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),

  removeTaskLocally: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  filterCategory: null,

  setFilterCategory: (cat) => set({ filterCategory: cat }),
}))
