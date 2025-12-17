import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Crown, Search, ToggleLeft, ToggleRight, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface User {
  user_id: string
  name: string
  username: string | null
  email: string
  avatar_url: string | null
  is_premium: boolean
  created_at: string
  updated_at: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // Buscar perfis
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Buscar emails individualmente para cada perfil
      const usersWithEmail = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            // Tentar buscar email via RPC
            const { data: email } = await supabase.rpc('get_user_email', {
              user_uuid: profile.user_id,
            })

            // Buscar metadata também
            const { data: metadata } = await supabase.rpc('get_user_metadata', {
              user_uuid: profile.user_id,
            })

            return {
              ...profile,
              email: email || 'N/A',
              is_premium:
                (profile as any).is_premium ||
                metadata?.is_premium ||
                false,
            }
          } catch (err) {
            // Se der erro, tentar via list_all_users como fallback
            try {
              const { data: allUsers } = await supabase.rpc('list_all_users')
              const authUser = allUsers?.find((u: any) => u.id === profile.user_id)
              return {
                ...profile,
                email: authUser?.email || 'N/A',
                is_premium:
                  (profile as any).is_premium ||
                  authUser?.metadata?.is_premium ||
                  false,
              }
            } catch {
              return {
                ...profile,
                email: 'N/A',
                is_premium: (profile as any).is_premium || false,
              }
            }
          }
        })
      )

      setUsers(usersWithEmail)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('update_user_premium', {
        user_uuid: userId,
        is_premium_status: !currentStatus,
      })

      if (error) throw error

      // Atualizar estado local
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId
            ? { ...user, is_premium: !currentStatus }
            : user
        )
      )
    } catch (error: any) {
      alert(`Erro ao atualizar status premium: ${error.message}`)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Carregando usuários...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Usuários do App</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuários..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Cadastrado em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.name}
                      </div>
                      {user.username && (
                        <div className="text-sm text-gray-400">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300 font-medium">
                    {user.email && user.email !== 'N/A' ? (
                      user.email
                    ) : (
                      <span className="text-gray-500 italic">Sem email</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.is_premium ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                        Free
                      </span>
                    )}
                    <button
                      onClick={() => togglePremium(user.user_id, user.is_premium)}
                      className="ml-2 text-gray-400 hover:text-white transition"
                      title={user.is_premium ? 'Remover Premium' : 'Tornar Premium'}
                    >
                      {user.is_premium ? (
                        <ToggleRight className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {format(new Date(user.created_at), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={`/users/${user.user_id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  )
}
