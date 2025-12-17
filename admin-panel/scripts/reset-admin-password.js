/**
 * Script para resetar senha de administrador
 * 
 * Uso:
 *   pnpm reset-admin-password
 * 
 * Requer variáveis de ambiente no .env:
 *   - VITE_SUPABASE_URL (ou EXPO_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

// Carregar .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env')

// Tentar carregar .env
const result = config({ path: envPath })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log('🔐 Resetar Senha de Administrador\n')

  // Carregar variáveis de ambiente
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ Erro: SUPABASE_URL não encontrada')
    console.log(`\n📂 Arquivo .env esperado em: ${envPath}`)
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada')
    console.log(`\n📂 Arquivo .env esperado em: ${envPath}`)
    process.exit(1)
  }

  // Criar cliente com service_role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Coletar informações
  const email = await question('📧 Email do admin: ')

  if (!email) {
    console.error('❌ Email é obrigatório')
    process.exit(1)
  }

  try {
    console.log('\n⏳ Buscando usuário...')

    // Buscar usuário
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.error(`\n❌ Usuário com email ${email} não encontrado`)
      console.log('\n💡 Dica: O usuário precisa existir no Supabase Auth primeiro')
      process.exit(1)
    }

    console.log(`✅ Usuário encontrado: ${user.email}`)
    console.log(`   ID: ${user.id}`)

    // Verificar se é admin
    const isAdmin = user.user_metadata?.role === 'admin'
    console.log(`   Admin: ${isAdmin ? '✅ Sim' : '❌ Não'}`)

    if (!isAdmin) {
      console.log('\n⚠️  Este usuário não é admin. Deseja torná-lo admin também? (s/n)')
      const makeAdmin = await question('> ')
      
      if (makeAdmin.toLowerCase() === 's' || makeAdmin.toLowerCase() === 'sim') {
        // Atualizar para admin
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            role: 'admin',
          },
        })

        if (updateError) throw updateError

        // Adicionar na tabela admins
        const { error: insertError } = await supabase.from('admins').upsert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          is_active: true,
        })

        if (insertError && insertError.code !== '23505') {
          console.warn('⚠️  Aviso ao adicionar na tabela admins:', insertError.message)
        }

        console.log('✅ Usuário agora é admin!')
      }
    }

    // Pedir nova senha
    console.log('\n🔑 Defina uma nova senha:')
    const password = await question('   Senha (mínimo 6 caracteres): ')

    if (!password || password.length < 6) {
      console.error('❌ Senha deve ter no mínimo 6 caracteres')
      process.exit(1)
    }

    // Confirmar senha
    const confirmPassword = await question('   Confirme a senha: ')

    if (password !== confirmPassword) {
      console.error('❌ Senhas não coincidem')
      process.exit(1)
    }

    // Atualizar senha
    console.log('\n⏳ Atualizando senha...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
    })

    if (updateError) throw updateError

    console.log('\n✅ Senha atualizada com sucesso!')
    console.log(`\n📧 Email: ${email}`)
    console.log(`🔑 Nova senha: ${password}`)
    console.log('\n🚀 Agora você pode fazer login no painel admin!')
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
