const express = require('express');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Carregar o swagger.json
let swaggerDocument;
try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
  swaggerDocument = JSON.parse(swaggerContent);
  console.log('✅ Swagger JSON carregado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao carregar swagger.json:', error.message);
  process.exit(1);
}

// Middleware para CORS (caso necessário)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Servir a documentação Swagger
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'My Book App API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  }
}));

// Rota raiz redireciona para a documentação
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Servir o JSON da documentação
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Swagger server is running' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('📚 DOCUMENTAÇÃO SWAGGER INICIADA COM SUCESSO!');
  console.log('='.repeat(70));
  console.log('\n🌐 Acesse no seu navegador:');
  console.log(`   👉 http://localhost:${PORT}/api-docs`);
  console.log('\n📄 Outros endpoints:');
  console.log(`   JSON: http://localhost:${PORT}/swagger.json`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('\n📊 Estatísticas:');
  console.log(`   Total de endpoints: ${Object.keys(swaggerDocument.paths).length}`);
  console.log(`   Tags: ${swaggerDocument.tags.length}`);
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  Pressione Ctrl+C para parar o servidor');
  console.log('='.repeat(70) + '\n');
});
