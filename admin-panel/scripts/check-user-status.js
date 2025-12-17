/**
 * Script para verificar status do usuário e diagnosticar problemas de login
 * 
 * Uso:
 *   node scripts/check-user-status.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

// Carregar .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '..', '.env')

config({ path: envPath })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log('🔍 Verificar Status do Usuário\n')

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const email = await question('📧 Email do usuário: ')

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
      process.exit(1)
    }

    console.log('\n✅ Usuário encontrado!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Email confirmado: ${user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`)
    console.log(`   Criado em: ${user.created_at}`)
    console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}`)

    console.log('\n📋 Metadata:')
    console.log(JSON.stringify(user.user_metadata, null, 2))

    // Verificar se é admin
    const isAdmin = user.user_metadata?.role === 'admin'
    console.log(`\n👑 Admin: ${isAdmin ? '✅ Sim' : '❌ Não'}`)

    // Verificar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      console.log('\n👤 Perfil encontrado:')
      console.log(`   Nome: ${profile.name}`)
      console.log(`   Username: ${profile.username || 'N/A'}`)
      console.log(`   Premium: ${profile.is_premium ? '✅ Sim' : '❌ Não'}`)
    } else {
      console.log('\n⚠️  Perfil não encontrado na tabela profiles')
    }

    // Verificar se está na tabela admins
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (admin) {
      console.log('\n🔐 Admin na tabela admins:')
      console.log(`   Ativo: ${admin.is_active ? '✅ Sim' : '❌ Não'}`)
      console.log(`   Criado em: ${admin.created_at}`)
    }

    console.log('\n💡 Diagnóstico:')
    
    if (!user.email_confirmed_at) {
      console.log('   ⚠️  Email não confirmado - isso pode impedir o login')
    }

    if (isAdmin) {
      console.log('   ℹ️  Usuário é admin - pode fazer login no painel admin')
    }

    if (!profile) {
      console.log('   ⚠️  Perfil não existe - pode causar problemas no app')
    }

    console.log('\n🔧 Opções:')
    console.log('   1. Resetar senha')
    console.log('   2. Confirmar email')
    console.log('   3. Verificar tudo está OK')
    
    const option = await question('\nEscolha uma opção (1-3) ou Enter para sair: ')

    if (option === '1') {
      const newPassword = await question('Nova senha (mínimo 6 caracteres): ')
      if (newPassword && newPassword.length >= 6) {
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
          password: newPassword,
        })
        if (error) throw error
        console.log('✅ Senha atualizada com sucesso!')
      }
    } else if (option === '2') {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      })
      if (error) throw error
      console.log('✅ Email confirmado!')
    } else if (option === '3') {
      console.log('\n✅ Verificação completa!')
    }
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
