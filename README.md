# Aplicativo Kanban

Um aplicativo de gerenciamento de tarefas estilo Kanban desenvolvido com React, TypeScript e Material UI.

## Funcionalidades

- **Tarefas completas**:
  - Criar tarefas simples ou detalhadas
  - Editar tarefas existentes
  - Definir prioridades (baixa, média, alta)
  - Adicionar datas de vencimento
  - Incluir descrições
  - Adicionar etiquetas personalizadas
  - Excluir tarefas

- **Colunas gerenciáveis**:
  - Criar novas colunas
  - Editar o título das colunas
  - Excluir colunas

- **Funcionalidade de arrastar e soltar**:
  - Mover tarefas entre colunas
  - Reordenar tarefas dentro da mesma coluna

- **Filtros e pesquisa**:
  - Pesquisar tarefas por texto
  - Filtrar por prioridade
  - Filtrar por etiquetas

- **Persistência de dados**:
  - Salvar automaticamente no localStorage
  - Exportar dados como JSON
  - Importar dados de arquivos JSON

## Como iniciar o aplicativo

### No Windows PowerShell

Como o PowerShell não aceita o operador && para encadear comandos, você pode usar o script PowerShell incluído:

```powershell
# Navegue para o diretório do projeto (se ainda não estiver nele)
cd kanban

# Execute o script PowerShell
.\start.ps1
```

Ou execute diretamente:

```powershell
cd kanban
npm start
```

### No Prompt de Comando ou terminal bash/zsh

```bash
cd kanban && npm start
```

## Tecnologias utilizadas

- React
- TypeScript
- Material UI
- React Beautiful DnD (arrastar e soltar)
- Context API para gerenciamento de estado
- LocalStorage para persistência de dados

## Estrutura do projeto

- `/src/components`: Componentes React
- `/src/context`: Contexto e lógica de estado (KanbanContext)
- `/src/types`: Interfaces TypeScript

## Próximos passos

- Adicionar autenticação de usuários
- Backend para persistência de dados
- Funcionalidade de compartilhamento
- Anexos de arquivos
