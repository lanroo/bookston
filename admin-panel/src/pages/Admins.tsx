import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search, Shield, Trash2, UserCheck, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import CreateAdminModal from '../components/CreateAdminModal'
import { supabase } from '../lib/supabase'

interface Admin {
  id: string
  user_id: string
  email: string
  name: string
  created_by: string | null
  created_by_name: string | null
  is_active: boolean
  last_login_at: string | null
  notes: string | null
  created_at: string
}

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase.rpc('list_all_admins')

      if (error) throw error

      setAdmins(data || [])
    } catch (error) {
      console.error('Erro ao carregar admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (userId: string, adminName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${adminName} como administrador?`)) {
      return
    }

    try {
      const { error } = await supabase.rpc('remove_admin', {
        admin_user_id: userId,
      })

      if (error) throw error

      loadAdmins()
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('update_admin_status', {
        admin_user_id: userId,
        is_active_status: !currentStatus,
      })

      if (error) throw error

      loadAdmins()
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    }
  }

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Carregando administradores...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administradores</h1>
          <p className="text-gray-400 mt-2">
            {admins.length} administrador(es) cadastrado(s)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Adicionar Admin
        </button>
      </div>

      <div className="mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar administradores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Administrador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Criado por
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Último login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Cadastrado em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium">{admin.name}</div>
                      <div className="text-sm text-gray-400">{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {admin.created_by_name || '-'}
                </td>
                <td className="px-6 py-4">
                  {admin.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      <UserCheck className="w-3 h-3" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      <UserX className="w-3 h-3" />
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {admin.last_login_at
                    ? format(new Date(admin.last_login_at), "dd MMM yyyy HH:mm", {
                        locale: ptBR,
                      })
                    : 'Nunca'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {format(new Date(admin.created_at), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(admin.user_id, admin.is_active)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      {admin.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => handleRemoveAdmin(admin.user_id, admin.name)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAdmins.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {search ? 'Nenhum administrador encontrado' : 'Nenhum administrador cadastrado'}
        </div>
      )}

      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadAdmins()
          }}
        />
      )}
    </div>
  )
}
