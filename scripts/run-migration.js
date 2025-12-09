

const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, '../database/migration_social_features.sql');

function readMigrationFile() {
  try {
    return fs.readFileSync(MIGRATION_FILE, 'utf8');
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de migração:', error.message);
    process.exit(1);
  }
}

function printInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA EXECUTAR A MIGRAÇÃO:\n');
  console.log('1. Acesse o Supabase Dashboard: https://app.supabase.com');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá em "SQL Editor" no menu lateral');
  console.log('4. Clique em "New query"');
  console.log('5. Cole o SQL abaixo e clique em "Run" (ou Ctrl/Cmd + Enter)\n');
  console.log('─'.repeat(80));
  console.log('\n');
}

function main() {
  console.log('🚀 Script de Migração - Funcionalidades Sociais\n');
  
  const sql = readMigrationFile();
  
  printInstructions();
  console.log(sql);
  console.log('\n');
  console.log('─'.repeat(80));
  console.log('\n✅ Após executar, as seguintes tabelas serão criadas:');
  console.log('   - posts');
  console.log('   - post_likes');
  console.log('   - comments');
  console.log('   - comment_likes');
  console.log('   - user_points');
  console.log('   - points_transactions');
  console.log('\n💡 Dica: Você pode copiar o SQL acima e colar diretamente no Supabase SQL Editor\n');
}

if (require.main === module) {
  main();
}

module.exports = { readMigrationFile };

