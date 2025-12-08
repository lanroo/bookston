# 🏗️ Arquitetura do Projeto - Clean Code & SOLID

## 📁 Estrutura de Pastas

```
my-app/
├── app/                    # Telas (Expo Router)
│   ├── (tabs)/            # Telas com navegação por tabs
│   ├── _layout.tsx        # Layout raiz
│   └── *.tsx              # Outras telas
│
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI básicos
│   └── *.tsx             # Componentes específicos
│
├── contexts/             # Context API (Estado global)
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
│
├── hooks/                # Custom Hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── services/             # Lógica de negócio (Services)
│   ├── notes.service.ts
│   └── books.service.ts
│
├── lib/                  # Bibliotecas/configurações externas
│   └── supabase.ts
│
├── types/                # TypeScript types/interfaces
│   └── index.ts
│
└── constants/            # Constantes do app
    └── theme.ts
```

## 🎯 Princípios SOLID Aplicados

### 1. **Single Responsibility Principle (SRP)**
- ✅ Cada componente tem uma única responsabilidade
- ✅ Services separados por domínio (NotesService, BooksService)
- ✅ Contexts separados por funcionalidade (Auth, Theme)

### 2. **Open/Closed Principle (OCP)**
- ✅ Componentes extensíveis via props
- ✅ Services podem ser estendidos sem modificar código existente

### 3. **Liskov Substitution Principle (LSP)**
- ✅ Componentes seguem contratos consistentes
- ✅ Interfaces bem definidas

### 4. **Interface Segregation Principle (ISP)**
- ✅ Props específicas para cada componente
- ✅ Hooks com responsabilidades claras

### 5. **Dependency Inversion Principle (DIP)**
- ✅ Dependências injetadas via props
- ✅ Services abstraem implementações (Supabase)

## 📦 Componentes Modulares

### Componentes Base (UI)
- `ThemedText` - Texto com suporte a tema
- `ThemedView` - View com suporte a tema
- `ThemedTextInput` - Input com suporte a tema
- `ActionButton` - Botão de ação padronizado

### Componentes Compostos
- `ScreenHeader` - Header padrão de telas
- `EmptyState` - Estado vazio padronizado
- `TabSelector` - Seletor de tabs reutilizável

## 🔧 Services (Lógica de Negócio)

### NotesService
- `getNotes()` - Buscar notas
- `createNote()` - Criar nota
- `updateNote()` - Atualizar nota
- `deleteNote()` - Deletar nota
- `getFolders()` - Buscar pastas
- `createFolder()` - Criar pasta

### BooksService
- `getBooks()` - Buscar livros
- `createBook()` - Criar livro
- `updateBook()` - Atualizar livro
- `deleteBook()` - Deletar livro
- `getBookStats()` - Estatísticas de livros

## 🎨 Design System

### Cores
- Centralizadas em `constants/theme.ts`
- Suporte a tema claro/escuro
- Cores semânticas (text, background, tint)

### Componentes Temáticos
- Todos os componentes seguem o design system
- Adaptação automática ao tema
- Consistência visual garantida

## 📝 Boas Práticas Implementadas

### 1. **TypeScript**
- ✅ Tipos centralizados em `types/index.ts`
- ✅ Interfaces bem definidas
- ✅ Type safety em todo o código

### 2. **Componentização**
- ✅ Componentes pequenos e focados
- ✅ Reutilização máxima
- ✅ Props tipadas

### 3. **Separação de Responsabilidades**
- ✅ UI separada de lógica de negócio
- ✅ Services para operações de dados
- ✅ Contexts para estado global

### 4. **Performance**
- ✅ Componentes memoizados quando necessário
- ✅ Lazy loading de telas
- ✅ Otimizações de renderização

### 5. **Manutenibilidade**
- ✅ Código limpo e legível
- ✅ Comentários quando necessário
- ✅ Estrutura organizada

## 🚀 Padrões de Desenvolvimento

### Nomenclatura
- **Componentes**: PascalCase (`ScreenHeader`)
- **Hooks**: camelCase com prefixo `use` (`useColorScheme`)
- **Services**: PascalCase com sufixo `Service` (`NotesService`)
- **Types**: PascalCase (`Book`, `Note`)

### Estrutura de Arquivos
- Um componente por arquivo
- Exports nomeados
- Imports organizados

### Props e State
- Props tipadas com TypeScript
- Estado local quando possível
- Context para estado global compartilhado

## 📚 Próximos Passos

1. ✅ Criar mais componentes reutilizáveis
2. ✅ Implementar testes unitários
3. ✅ Adicionar error boundaries
4. ✅ Implementar loading states
5. ✅ Adicionar validações de formulário

## 🔄 Fluxo de Dados

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

## ✅ Checklist de Qualidade

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

