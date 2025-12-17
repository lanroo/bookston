/**
 * Script para criar o primeiro administrador
 * 
 * Uso:
 *   pnpm create-admin
 * 
 * Requer variáveis de ambiente no .env:
 *   - VITE_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (chave de serviço, NÃO a anon key!)
 * 
 * Você encontra a SERVICE_ROLE_KEY em:
 *   Supabase Dashboard > Settings > API > service_role (secret)
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

// Se não encontrou, avisar
if (result.error && result.error.code !== 'ENOENT') {
  console.warn('⚠️  Aviso ao carregar .env:', result.error.message)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log('🔐 Criar Primeiro Administrador\n')

  // Carregar variáveis de ambiente (aceita vários prefixos)
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ Erro: SUPABASE_URL não encontrada')
    console.log('\n📝 Adicione no arquivo admin-panel/.env:')
    console.log('   VITE_SUPABASE_URL=https://seu-projeto.supabase.co')
    console.log('\n💡 Ou defina como variável de ambiente:')
    console.log('   export VITE_SUPABASE_URL=https://seu-projeto.supabase.co')
    console.log(`\n📂 Arquivo .env esperado em: ${envPath}`)
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada')
    console.log('\n📝 Adicione no arquivo admin-panel/.env:')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui')
    console.log('\n⚠️  IMPORTANTE: Use a SERVICE_ROLE_KEY, não a ANON_KEY!')
    console.log('Você encontra ela em: Supabase Dashboard > Settings > API > service_role (secret)')
    console.log('\n🔒 A SERVICE_ROLE_KEY é diferente da ANON_KEY:')
    console.log('   - ANON_KEY: começa com "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."')
    console.log('   - SERVICE_ROLE_KEY: é uma string longa (secret key)')
    console.log(`\n📂 Arquivo .env esperado em: ${envPath}`)
    console.log('\n💡 Depois de adicionar, execute novamente: pnpm create-admin')
    process.exit(1)
  }

  // Criar cliente com service_role (permite criar usuários)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Coletar informações
  const email = await question('📧 Email: ')
  const password = await question('🔑 Senha (mínimo 6 caracteres): ')
  const name = await question('👤 Nome (opcional, Enter para usar email): ')

  if (!email || !password) {
    console.error('❌ Email e senha são obrigatórios')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('❌ Senha deve ter no mínimo 6 caracteres')
    process.exit(1)
  }

  try {
    console.log('\n⏳ Criando usuário...')

    // 1. Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: name || email.split('@')[0],
        role: 'admin',
      },
    })

    if (authError) {
      // Se o usuário já existe, tentar atualizar
      const errorMsg = authError.message?.toLowerCase() || ''
      if (
        errorMsg.includes('already registered') ||
        errorMsg.includes('already been registered') ||
        errorMsg.includes('user already exists') ||
        authError.status === 422
      ) {
        console.log('⚠️  Usuário já existe. Atualizando para admin...')

        // Buscar usuário existente
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError

        const existingUser = users.users.find((u) => u.email === email)
        if (!existingUser) {
          throw new Error('Usuário não encontrado')
        }

        // Atualizar metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...existingUser.user_metadata,
              name: name || existingUser.user_metadata?.name || email.split('@')[0],
              role: 'admin',
            },
          }
        )

        if (updateError) throw updateError

        // Adicionar na tabela admins
        const { error: insertError } = await supabase.from('admins').insert({
          user_id: existingUser.id,
          email: existingUser.email,
          name: name || existingUser.user_metadata?.name || email.split('@')[0],
          is_active: true,
        })

        if (insertError) {
          // Se já existe na tabela, apenas atualizar
          if (insertError.code === '23505') {
            console.log('✅ Admin já existe na tabela. Atualizando...')
            await supabase
              .from('admins')
              .update({ is_active: true })
              .eq('user_id', existingUser.id)
          } else {
            throw insertError
          }
        }

        console.log('\n✅ Administrador criado/atualizado com sucesso!')
        console.log(`   Email: ${email}`)
        console.log(`   ID: ${existingUser.id}`)
        console.log('\n🚀 Agora você pode fazer login no painel admin!')
        rl.close()
        return
      }

      throw authError
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log('✅ Usuário criado no auth')

    // 2. Adicionar na tabela admins
    console.log('⏳ Adicionando na tabela admins...')

    const { error: insertError } = await supabase.from('admins').insert({
      user_id: authData.user.id,
      email: authData.user.email,
      name: name || email.split('@')[0],
      is_active: true,
    })

    if (insertError) {
      // Se já existe, apenas atualizar
      if (insertError.code === '23505') {
        await supabase
          .from('admins')
          .update({ is_active: true })
          .eq('user_id', authData.user.id)
      } else {
        throw insertError
      }
    }

    console.log('✅ Admin adicionado na tabela')

    console.log('\n✅ Administrador criado com sucesso!')
    console.log(`   Email: ${email}`)
    console.log(`   ID: ${authData.user.id}`)
    console.log('\n🚀 Agora você pode fazer login no painel admin!')
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
