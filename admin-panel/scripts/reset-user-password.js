/**
 * Script para resetar senha de qualquer usuário do app
 * 
 * Uso:
 *   pnpm reset-user-password
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
  console.log('🔐 Resetar Senha de Usuário do App\n')

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas')
    console.log('Adicione SUPABASE_SERVICE_ROLE_KEY no admin-panel/.env')
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
    console.log(`   Role: ${user.user_metadata?.role || 'Nenhum'}`)

    // Verificar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      console.log(`\n👤 Perfil encontrado:`)
      console.log(`   Nome: ${profile.name}`)
      console.log(`   Premium: ${profile.is_premium ? '✅ Sim' : '❌ Não'}`)
    } else {
      console.log('\n⚠️  Perfil não encontrado')
    }

    // Resetar senha
    console.log('\n🔑 Defina uma nova senha:')
    const password = await question('   Senha (mínimo 6 caracteres): ')

    if (!password || password.length < 6) {
      console.error('❌ Senha deve ter no mínimo 6 caracteres')
      process.exit(1)
    }

    const confirmPassword = await question('   Confirme a senha: ')

    if (password !== confirmPassword) {
      console.error('❌ Senhas não coincidem')
      process.exit(1)
    }

    console.log('\n⏳ Atualizando senha...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
    })

    if (updateError) throw updateError

    console.log('\n✅ Senha atualizada com sucesso!')
    console.log(`\n📧 Email: ${email}`)
    console.log(`🔑 Nova senha: ${password}`)
    console.log('\n🚀 Agora você pode fazer login no app!')
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
