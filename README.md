# My App

Aplicativo mobile desenvolvido com React Native e Expo para gerenciamento de notas e biblioteca pessoal de livros.

## Descrição

Aplicativo completo de produtividade que permite aos usuários:
- Criar e gerenciar notas com suporte a Markdown
- Organizar notas em pastas personalizadas
- Gerenciar uma biblioteca pessoal de livros
- Buscar livros através de APIs públicas (Google Books, Open Library)
- Avaliar e fazer resenhas de livros
- Acompanhar o status de leitura dos livros

## Tecnologias

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma e ferramentas para React Native
- **TypeScript** - Tipagem estática
- **Expo Router** - Roteamento baseado em arquivos
- **Supabase** - Backend como serviço (autenticação e banco de dados)
- **React Context API** - Gerenciamento de estado global
- **AsyncStorage** - Armazenamento local

## Requisitos

- Node.js 18+ 
- npm ou yarn
- Expo CLI
- Conta no Supabase (para autenticação e banco de dados)

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd my-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

4. Configure o banco de dados:
Execute o script SQL em `database/setup.sql` no seu projeto Supabase para criar as tabelas necessárias.

5. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento Expo
- `npm run android` - Executa o app no emulador Android
- `npm run ios` - Executa o app no simulador iOS
- `npm run web` - Executa o app no navegador
- `npm run lint` - Executa o linter para verificar erros de código

## Estrutura de Pastas

```
my-app/
├── app/                    # Telas (Expo Router)
│   ├── (tabs)/            # Telas com navegação por tabs
│   │   ├── index.tsx      # Tela inicial
│   │   ├── notes.tsx      # Gerenciamento de notas
│   │   ├── books.tsx      # Biblioteca de livros
│   │   └── settings.tsx   # Configurações
│   ├── _layout.tsx        # Layout raiz
│   ├── login.tsx          # Tela de login
│   ├── signup.tsx         # Tela de cadastro
│   └── profile.tsx        # Perfil do usuário
│
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI básicos
│   ├── note-modal.tsx    # Modal de edição de notas
│   ├── book-details-modal.tsx  # Detalhes do livro
│   ├── interactive-rating.tsx  # Avaliação interativa
│   └── ...
│
├── contexts/             # Context API (Estado global)
│   ├── AuthContext.tsx   # Contexto de autenticação
│   └── ThemeContext.tsx  # Contexto de tema
│
├── hooks/                # Custom Hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── services/             # Lógica de negócio (Services)
│   ├── notes.service.ts  # Serviço de notas
│   ├── books.service.ts  # Serviço de livros
│   └── book-search.service.ts  # Busca de livros
│
├── lib/                  # Bibliotecas/configurações externas
│   └── supabase.ts       # Cliente Supabase
│
├── database/             # Schemas e migrações do banco
│   └── setup.sql         # Script de criação das tabelas
│
├── types/                # TypeScript types/interfaces
│   └── index.ts
│
├── constants/            # Constantes do app
│   └── theme.ts          # Configurações de tema
│
└── styles/               # Estilos compartilhados
    ├── common.styles.ts
    └── spacing.ts
```

## Arquitetura

### Princípios SOLID Aplicados

#### Single Responsibility Principle (SRP)
- Cada componente tem uma única responsabilidade
- Services separados por domínio (NotesService, BooksService)
- Contexts separados por funcionalidade (Auth, Theme)

#### Open/Closed Principle (OCP)
- Componentes extensíveis via props
- Services podem ser estendidos sem modificar código existente

#### Liskov Substitution Principle (LSP)
- Componentes seguem contratos consistentes
- Interfaces bem definidas

#### Interface Segregation Principle (ISP)
- Props específicas para cada componente
- Hooks com responsabilidades claras

#### Dependency Inversion Principle (DIP)
- Dependências injetadas via props
- Services abstraem implementações (Supabase)

### Componentes Modulares

#### Componentes Base (UI)
- `ThemedText` - Texto com suporte a tema
- `ThemedView` - View com suporte a tema
- `ThemedTextInput` - Input com suporte a tema
- `ActionButton` - Botão de ação padronizado

#### Componentes Compostos
- `ScreenHeader` - Header padrão de telas
- `EmptyState` - Estado vazio padronizado
- `TabSelector` - Seletor de tabs reutilizável
- `NoteModal` - Modal completo de edição de notas
- `BookDetailsModal` - Modal de detalhes do livro
- `InteractiveRating` - Componente de avaliação com gestos

### Services (Lógica de Negócio)

#### NotesService
- `getNotes()` - Buscar notas do usuário
- `createNote()` - Criar nova nota
- `updateNote()` - Atualizar nota existente
- `deleteNote()` - Deletar nota
- `getFolders()` - Buscar pastas do usuário
- `createFolder()` - Criar nova pasta
- `updateFolder()` - Atualizar pasta
- `deleteFolder()` - Deletar pasta

#### BooksService
- `getBooks()` - Buscar livros do usuário
- `getBookById()` - Buscar livro específico
- `createBook()` - Adicionar livro à biblioteca
- `updateBook()` - Atualizar informações do livro
- `deleteBook()` - Remover livro da biblioteca
- `getBookStats()` - Estatísticas de livros por status

#### BookSearchService
- `searchBooks()` - Buscar livros em múltiplas APIs
- `searchGoogleBooks()` - Buscar na Google Books API
- `searchOpenLibraryBooks()` - Buscar na Open Library API
- `getGoogleBookDetails()` - Obter detalhes completos de um livro

### Design System

#### Cores
- Centralizadas em `constants/theme.ts`
- Suporte a tema claro/escuro
- Cores semânticas (text, background, tint)
- Adaptação automática ao tema do sistema

#### Componentes Temáticos
- Todos os componentes seguem o design system
- Adaptação automática ao tema
- Consistência visual garantida

## Fluxo de Dados

```
User Action
    ↓
Component (UI)
    ↓
Service (Business Logic)
    ↓
Supabase (Data Layer)
    ↓
Response
    ↓
Update State (Context/State)
    ↓
Re-render Component
```

## Padrões de Desenvolvimento

### Nomenclatura
- **Componentes**: PascalCase (`ScreenHeader`)
- **Hooks**: camelCase com prefixo `use` (`useColorScheme`)
- **Services**: PascalCase com sufixo `Service` (`NotesService`)
- **Types**: PascalCase (`Book`, `Note`)
- **Arquivos**: kebab-case (`book-details-modal.tsx`)

### Estrutura de Arquivos
- Um componente por arquivo
- Exports nomeados
- Imports organizados por categoria

### Props e State
- Props tipadas com TypeScript
- Estado local quando possível
- Context para estado global compartilhado

## Boas Práticas Implementadas

### TypeScript
- Tipos centralizados em `types/index.ts`
- Interfaces bem definidas
- Type safety em todo o código
- Sem uso de `any` desnecessário

### Componentização
- Componentes pequenos e focados
- Reutilização máxima
- Props tipadas
- Separação de responsabilidades

### Separação de Responsabilidades
- UI separada de lógica de negócio
- Services para operações de dados
- Contexts para estado global
- Hooks para lógica reutilizável

### Performance
- Componentes memoizados quando necessário
- Lazy loading de telas
- Otimizações de renderização
- Debounce em buscas

### Manutenibilidade
- Código limpo e legível
- Comentários quando necessário
- Estrutura organizada
- Documentação inline

## Funcionalidades Principais

### Gerenciamento de Notas
- Criação e edição de notas com suporte a Markdown
- Organização em pastas personalizadas
- Busca e filtragem de notas
- Formatação rica de texto
- Visualização e edição de metadados

### Biblioteca de Livros
- Busca de livros em APIs públicas
- Adição de livros à biblioteca pessoal
- Organização por status (Quero Ler, Lendo, Já Li, Relendo)
- Avaliação interativa com gestos
- Resenhas e notas pessoais
- Visualização de detalhes completos
- Estatísticas de leitura

### Autenticação
- Login e cadastro de usuários
- Recuperação de senha
- Sessão persistente
- Perfil do usuário

## Configuração do Banco de Dados

O projeto utiliza Supabase como backend. Para configurar:

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `database/setup.sql` no SQL Editor do Supabase
3. Configure as variáveis de ambiente no arquivo `.env`

O script cria as seguintes tabelas:
- `folders` - Pastas para organizar notas
- `notes` - Notas do usuário
- `books` - Livros da biblioteca pessoal

Todas as tabelas possuem Row Level Security (RLS) habilitado para isolar dados por usuário.

## Desenvolvimento

### Adicionar Nova Funcionalidade

1. Crie os tipos necessários em `types/index.ts`
2. Implemente a lógica de negócio em um Service
3. Crie os componentes necessários em `components/`
4. Adicione as telas em `app/`
5. Atualize a documentação se necessário

### Adicionar Novo Componente

1. Crie o arquivo em `components/`
2. Use TypeScript para tipar props
3. Siga o design system existente
4. Use componentes temáticos (ThemedText, ThemedView)
5. Adicione estilos em StyleSheet

## Checklist de Qualidade

- [x] Componentes modulares e reutilizáveis
- [x] Separação de responsabilidades
- [x] TypeScript em todo o código
- [x] Design system consistente
- [x] Services para lógica de negócio
- [x] Contexts para estado global
- [x] Hooks customizados
- [x] Estrutura de pastas organizada
- [x] Código limpo e legível
- [x] Princípios SOLID aplicados
- [x] Tratamento de erros
- [x] Loading states
- [x] Validações de formulário

## Documentação Adicional

- `ARCHITECTURE.md` - Detalhes da arquitetura do projeto
- `SUPABASE_SETUP.md` - Guia de configuração do Supabase
- `database/setup.sql` - Script de criação das tabelas

## Licença

Este projeto é privado.
