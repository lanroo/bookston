import { Search, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface CreateAdminModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAdminModal({
  onClose,
  onSuccess,
}: CreateAdminModalProps) {
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      setError('Digite um email para buscar')
      return
    }

    setSearching(true)
    setError('')
    setFoundUser(null)

    try {
      // Buscar usuário por email
      const { data: users } = await supabase.rpc('list_all_users')
      const user = users?.find((u: any) => 
        u.email.toLowerCase() === searchEmail.toLowerCase()
      )

      if (!user) {
        setError('Usuário não encontrado. O usuário precisa estar cadastrado no app primeiro.')
        return
      }

      // Verificar se já é admin
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existingAdmin) {
        setError('Este usuário já é administrador.')
        return
      }

      setFoundUser(user)
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar usuário')
    } finally {
      setSearching(false)
    }
  }

  const createAdmin = async () => {
    if (!foundUser) return

    setCreating(true)
    setError('')

    try {
      const { error } = await supabase.rpc('create_admin', {
        admin_user_id: foundUser.id,
        admin_email: foundUser.email,
        admin_name: foundUser.metadata?.name || foundUser.email.split('@')[0],
        admin_notes: notes || null,
      })

      if (error) throw error

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar administrador')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Adicionar Administrador</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!foundUser ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buscar usuário por email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={searchUser}
                disabled={searching}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              O usuário precisa estar cadastrado no app primeiro
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                <div>
                  <div className="font-medium">
                    {foundUser.metadata?.name || foundUser.email.split('@')[0]}
                  </div>
                  <div className="text-sm text-gray-400">{foundUser.email}</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre este administrador..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={createAdmin}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition"
              >
                {creating ? 'Criando...' : 'Criar Admin'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
