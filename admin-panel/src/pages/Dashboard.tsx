import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Activity,
    ArrowUpRight,
    BookOpen,
    Crown,
    FileText,
    Heart,
    MessageSquare,
    Star,
    TrendingUp,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'

interface Stats {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  totalBooks: number
  totalPosts: number
  totalComments: number
  totalNotes: number
  totalLikes: number
  totalPoints: number
  newUsersToday: number
  newUsersThisWeek: number
  activeUsers: number
  booksByStatus: {
    'want-to-read': number
    reading: number
    read: number
    rereading: number
  }
  recentUsers: Array<{
    user_id: string
    name: string
    email: string
    created_at: string
  }>
  recentPosts: Array<{
    id: string
    user_id: string
    book_title: string
    content: string
    created_at: string
    likes_count: number
  }>
  usersGrowth: Array<{ date: string; users: number }>
  postsGrowth: Array<{ date: string; posts: number }>
}

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#6b7280',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalBooks: 0,
    totalPosts: 0,
    totalComments: 0,
    totalNotes: 0,
    totalLikes: 0,
    totalPoints: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    activeUsers: 0,
    booksByStatus: {
      'want-to-read': 0,
      reading: 0,
      read: 0,
      rereading: 0,
    },
    recentUsers: [],
    recentPosts: [],
    usersGrowth: [],
    postsGrowth: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = subDays(today, 7)
      const thirtyDaysAgo = subDays(today, 30)

      const [
        { count: totalUsers },
        { count: premiumUsers },
        { count: totalBooks },
        { count: totalPosts },
        { count: totalComments },
        { count: totalNotes },
        postLikesResult,
        commentLikesResult,
        { data: pointsData },
        { count: newUsersToday },
        { count: newUsersThisWeek },
        { count: activeUsers },
        { data: booksData },
        { data: recentProfiles },
        { data: recentPosts },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('post_likes').select('*', { count: 'exact', head: true }),
        supabase.from('comment_likes').select('*', { count: 'exact', head: true }),
        supabase.from('user_points').select('total_points'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo.toISOString()),
        supabase.from('books').select('status'),
        supabase.from('profiles').select('user_id, name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('posts').select('id, user_id, book_title, content, created_at, likes_count').order('created_at', { ascending: false }).limit(5),
      ])

      const freeUsers = (totalUsers || 0) - (premiumUsers || 0)
      const totalLikes = (postLikesResult.count || 0) + (commentLikesResult.count || 0)
      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0

      const booksByStatus = {
        'want-to-read': booksData?.filter((b) => b.status === 'want-to-read').length || 0,
        reading: booksData?.filter((b) => b.status === 'reading').length || 0,
        read: booksData?.filter((b) => b.status === 'read').length || 0,
        rereading: booksData?.filter((b) => b.status === 'rereading').length || 0,
      }

      const recentUsersWithEmail = await Promise.all(
        (recentProfiles || []).map(async (profile) => {
          try {
            const { data: email } = await supabase.rpc('get_user_email', { user_uuid: profile.user_id })
            return { ...profile, email: email || 'N/A' }
          } catch {
            return { ...profile, email: 'N/A' }
          }
        })
      )

      const usersGrowth = []
      const postsGrowth = []
      for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i)
        const dateStart = new Date(date)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(date)
        dateEnd.setHours(23, 59, 59, 999)

        const [{ count: userCount }, { count: postCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', dateStart.toISOString()).lte('created_at', dateEnd.toISOString()),
          supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', dateStart.toISOString()).lte('created_at', dateEnd.toISOString()),
        ])

        usersGrowth.push({ date: format(date, 'dd/MM'), users: userCount || 0 })
        postsGrowth.push({ date: format(date, 'dd/MM'), posts: postCount || 0 })
      }

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        freeUsers,
        totalBooks: totalBooks || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalNotes: totalNotes || 0,
        totalLikes,
        totalPoints,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        activeUsers: activeUsers || 0,
        booksByStatus,
        recentUsers: recentUsersWithEmail,
        recentPosts: recentPosts || [],
        usersGrowth,
        postsGrowth,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-gray-400">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      change: stats.newUsersToday,
      changeLabel: 'hoje',
      trend: 'up',
      color: COLORS.primary,
      link: '/users',
    },
    {
      title: 'Usuários Premium',
      value: stats.premiumUsers,
      icon: Crown,
      percentage: stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : '0',
      color: COLORS.warning,
      link: '/premium',
    },
    {
      title: 'Livros Cadastrados',
      value: stats.totalBooks,
      icon: BookOpen,
      color: COLORS.success,
    },
    {
      title: 'Posts',
      value: stats.totalPosts,
      icon: MessageSquare,
      color: COLORS.purple,
    },
    {
      title: 'Comentários',
      value: stats.totalComments,
      icon: MessageSquare,
      color: COLORS.info,
    },
    {
      title: 'Notas',
      value: stats.totalNotes,
      icon: FileText,
      color: COLORS.gray,
    },
    {
      title: 'Curtidas',
      value: stats.totalLikes,
      icon: Heart,
      color: COLORS.danger,
    },
    {
      title: 'Pontos Totais',
      value: stats.totalPoints,
      icon: Star,
      color: COLORS.warning,
    },
  ]

  const booksStatusData = [
    { name: 'Quero Ler', value: stats.booksByStatus['want-to-read'], color: COLORS.info },
    { name: 'Lendo', value: stats.booksByStatus.reading, color: COLORS.success },
    { name: 'Lido', value: stats.booksByStatus.read, color: COLORS.warning },
    { name: 'Relendo', value: stats.booksByStatus.rereading, color: COLORS.purple },
  ]

  const usersDistribution = [
    { name: 'Premium', value: stats.premiumUsers, color: COLORS.warning },
    { name: 'Free', value: stats.freeUsers, color: COLORS.gray },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-gray-300 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Visão Geral</h1>
          <p className="text-sm text-gray-400 mt-1">
            Última atualização: {format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const CardContent = (
            <div className="group relative bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.success }}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{stat.change}</span>
                  </div>
                )}
                {stat.percentage && (
                  <span className="text-xs font-medium text-gray-400">{stat.percentage}%</span>
                )}
              </div>
              <h3 className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString('pt-BR')}</p>
              {stat.changeLabel && (
                <p className="text-xs text-gray-500 mt-1.5">{stat.changeLabel}</p>
              )}
              {stat.link && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>
          )

          return stat.link ? (
            <Link key={index} to={stat.link} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={index}>{CardContent}</div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Growth */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Crescimento de Usuários</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.usersGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Posts Growth */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Crescimento de Posts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.postsGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="posts"
                stroke={COLORS.purple}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: COLORS.purple }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Books Status */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Livros por Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribuição atual</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={booksStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {booksStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                iconType="circle"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Premium Distribution */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Distribuição de Usuários</h2>
            <p className="text-xs text-gray-400 mt-0.5">Premium vs Free</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={usersDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {usersDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                iconType="circle"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Usuários Recentes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos cadastros</p>
            </div>
            <Link
              to="/users"
              className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <Link
                  key={user.user_id}
                  to={`/users/${user.user_id}`}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-gray-300" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-gray-200">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(user.created_at), 'dd MMM', { locale: ptBR })}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">Nenhum usuário recente</div>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Posts Recentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Últimas publicações</p>
          </div>
          <div className="space-y-3">
            {stats.recentPosts.length > 0 ? (
              stats.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium text-white line-clamp-1">{post.book_title}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-2 flex-shrink-0">
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes_count}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2">{post.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(post.created_at), 'dd MMM yyyy', { locale: ptBR })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">Nenhum post recente</div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Usuários Ativos</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.activeUsers}</p>
          <p className="text-xs text-gray-400">Últimos 30 dias</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Novos Esta Semana</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.newUsersThisWeek}</p>
          <p className="text-xs text-gray-400">Usuários cadastrados</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Taxa de Conversão</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-gray-400">Usuários Premium</p>
        </div>
      </div>
    </div>
  )
}
