import { ClientList } from '@/features/clients/components'

export default function ClientsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clientes</h1>
      <ClientList />
    </div>
  )
}
