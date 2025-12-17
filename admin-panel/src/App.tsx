import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { supabase } from './lib/supabase'
import Admins from './pages/Admins'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Payments from './pages/Payments'
import Premium from './pages/Premium'
import UserDetail from './pages/UserDetail'
import Users from './pages/Users'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verificar sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
      setLoading(false)
    })

    // Ouvir mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      checkAdmin(session?.user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAdmin = async (user: any) => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    // Verificar se o usuário tem role admin no metadata
    const role = user.user_metadata?.role
    if (role === 'admin') {
      setIsAdmin(true)
      // Atualizar last_login na tabela admins
      try {
        await supabase.rpc('update_admin_last_login', {
          admin_user_id: user.id,
        })
      } catch (error) {
        // Ignora erro se não estiver na tabela ainda
        console.debug('Admin não encontrado na tabela admins:', error)
      }
      return
    }

    // Verificar também na tabela admins
    try {
      const { data } = await supabase
        .from('admins')
        .select('is_active')
        .eq('user_id', user.id)
        .single()

      if (data && data.is_active) {
        setIsAdmin(true)
        // Atualizar metadata se não tiver
        if (role !== 'admin') {
          await supabase.auth.updateUser({
            data: { role: 'admin' },
          })
        }
        // Atualizar last_login
        await supabase.rpc('update_admin_last_login', {
          admin_user_id: user.id,
        })
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      setIsAdmin(false)
    }
  }

  return (
    <BrowserRouter>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Carregando...</div>
        </div>
      ) : !user || !isAdmin ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admins" element={<Admins />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  )
}

export default App
