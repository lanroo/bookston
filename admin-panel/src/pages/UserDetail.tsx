import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, BookOpen, Crown, MessageSquare, Star, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface UserData {
  profile: any
  stats: {
    totalBooks: number
    totalPosts: number
    totalComments: number
    totalPoints: number
    level: number
  }
}

export default function UserDetail() {
  const { id } = useParams()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingPremium, setUpdatingPremium] = useState(false)

  useEffect(() => {
    if (id) {
      loadUserData(id)
    }
  }, [id])

  const loadUserData = async (userId: string) => {
    try {
      // Buscar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Buscar email e metadata via RPC functions
      const [emailResult, metadataResult] = await Promise.all([
        supabase.rpc('get_user_email', { user_uuid: userId }),
        supabase.rpc('get_user_metadata', { user_uuid: userId }),
      ])

      const userEmail = emailResult.data
      const userMetadata = metadataResult.data || {}

      // Estatísticas
      const [booksResult, postsResult, commentsResult, pointsResult] =
        await Promise.all([
          supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single(),
        ])

      const points = pointsResult.data || {
        total_points: 0,
        level: 1,
      }

      setUserData({
        profile: {
          ...profile,
          email: userEmail || 'N/A',
          is_premium: userMetadata?.is_premium || (profile as any).is_premium || false,
        },
        stats: {
          totalBooks: booksResult.count || 0,
          totalPosts: postsResult.count || 0,
          totalComments: commentsResult.count || 0,
          totalPoints: points.total_points || 0,
          level: points.level || 1,
        },
      })
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePremium = async () => {
    if (!id || !userData) return

    setUpdatingPremium(true)
    try {
      const newStatus = !userData.profile.is_premium
      const { error } = await supabase.rpc('update_user_premium', {
        user_uuid: id,
        is_premium_status: newStatus,
      })

      if (error) throw error

      // Atualizar estado local
      setUserData({
        ...userData,
        profile: {
          ...userData.profile,
          is_premium: newStatus,
        },
      })
    } catch (error: any) {
      alert(`Erro ao atualizar status premium: ${error.message}`)
    } finally {
      setUpdatingPremium(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!userData) {
    return <div className="text-center py-12">Usuário não encontrado</div>
  }

  const { profile, stats } = userData

  return (
    <div>
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para usuários
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-2xl text-gray-400">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.username && (
                <p className="text-gray-400">@{profile.username}</p>
              )}
              <p className="text-gray-500">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile.is_premium ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400">
                <Crown className="w-4 h-4" />
                Premium
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-gray-300">
                Free
              </span>
            )}
            <button
              onClick={togglePremium}
              disabled={updatingPremium}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition text-sm"
              title={profile.is_premium ? 'Remover Premium' : 'Tornar Premium'}
            >
              {updatingPremium ? (
                'Atualizando...'
              ) : profile.is_premium ? (
                <>
                  <ToggleRight className="w-4 h-4 text-yellow-400" />
                  Remover Premium
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Tornar Premium
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Livros</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalBooks}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Posts</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comentários</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalComments}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Pontos</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalPoints}</p>
            <p className="text-xs text-gray-500">Nível {stats.level}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Informações</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Cadastrado em:</span>
              <p className="text-white">
                {format(new Date(profile.created_at), "dd MMMM yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Última atualização:</span>
              <p className="text-white">
                {format(new Date(profile.updated_at), "dd MMMM yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
