import { TaskBoard } from '@/features/tasks/components'

export default function TasksPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tablero de Tareas</h1>
      <TaskBoard />
    </div>
  )
}
