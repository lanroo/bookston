import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Crown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PremiumUser {
  user_id: string
  name: string
  email: string
  username: string | null
  is_premium: boolean
  premium_since: string | null
  premium_until: string | null
}

export default function Premium() {
  const [users, setUsers] = useState<PremiumUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPremiumUsers()
  }, [])

  const loadPremiumUsers = async () => {
    try {
      // Buscar apenas usuários premium
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_premium', true)
        .order('created_at', { ascending: false })

      // Buscar emails e metadata individualmente para cada usuário
      const premiumUsers = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            // Buscar email
            const { data: email } = await supabase.rpc('get_user_email', {
              user_uuid: profile.user_id,
            })

            // Buscar metadata
            const { data: metadata } = await supabase.rpc('get_user_metadata', {
              user_uuid: profile.user_id,
            })

            return {
              user_id: profile.user_id,
              name: profile.name,
              email: email || 'N/A',
              username: profile.username,
              is_premium: true,
              premium_since: metadata?.premium_since || null,
              premium_until: metadata?.premium_until || null,
            }
          } catch (err) {
            // Fallback: tentar via list_all_users
            try {
              const { data: allUsers } = await supabase.rpc('list_all_users')
              const authUser = allUsers?.find((u: any) => u.id === profile.user_id)
              return {
                user_id: profile.user_id,
                name: profile.name,
                email: authUser?.email || 'N/A',
                username: profile.username,
                is_premium: true,
                premium_since: authUser?.metadata?.premium_since || null,
                premium_until: authUser?.metadata?.premium_until || null,
              }
            } catch {
              return {
                user_id: profile.user_id,
                name: profile.name,
                email: 'N/A',
                username: profile.username,
                is_premium: true,
                premium_since: null,
                premium_until: null,
              }
            }
          }
        })
      )

      setUsers(premiumUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários premium:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      // Usar RPC function para atualizar premium
      const { error } = await supabase.rpc('update_user_premium', {
        user_uuid: userId,
        is_premium_status: !currentStatus,
        premium_until_date: !currentStatus ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      })

      if (error) throw error

      loadPremiumUsers()
    } catch (error) {
      console.error('Erro ao atualizar premium:', error)
      alert('Erro ao atualizar premium. Verifique o console.')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Usuários Premium</h1>
          <p className="text-gray-400 mt-2">
            {users.length} usuário(s) premium
          </p>
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
                Premium desde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Válido até
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.username && (
                        <div className="text-sm text-gray-400">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  {user.premium_since ? (
                    <div className="text-sm text-gray-300">
                      {format(new Date(user.premium_since), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.premium_until ? (
                    <div className="text-sm text-gray-300">
                      {format(new Date(user.premium_until), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Sem expiração</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/users/${user.user_id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Ver detalhes
                    </Link>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => togglePremium(user.user_id, user.is_premium)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover Premium
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum usuário premium encontrado
        </div>
      )}
    </div>
  )
}
