import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { KanbanState, Task, Comment, ChecklistItem } from '../types/types';

// Estado inicial do Kanban
const defaultState: KanbanState = {
  tasks: {},
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'A fazer',
      taskIds: [],
      color: '#0079BF',
    },
    'column-2': {
      id: 'column-2',
      title: 'Em andamento',
      taskIds: [],
      color: '#FF9D2A',
    },
    'column-3': {
      id: 'column-3',
      title: 'Concluído',
      taskIds: [],
      color: '#61BD4F',
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
  userPreferences: {
    theme: 'light',
    filters: {
      tags: [],
      assignees: [],
      priorities: [],
    }
  }
};

// Carregar estado do localStorage ou usar o padrão
const loadFromLocalStorage = (): KanbanState => {
  try {
    const savedState = localStorage.getItem('kanbanState');
    if (savedState) {
      // Convertendo strings de data de volta para objetos Date
      const parsedState = JSON.parse(savedState);
      
      // Converter datas de tarefas
      Object.keys(parsedState.tasks).forEach(taskId => {
        const task = parsedState.tasks[taskId];
        if (task.dueDate) task.dueDate = new Date(task.dueDate);
        if (task.createdAt) task.createdAt = new Date(task.createdAt);
        if (task.updatedAt) task.updatedAt = new Date(task.updatedAt);
        
        // Converter datas de comentários
        if (task.comments) {
          task.comments.forEach((comment: Comment) => {
            if (comment.createdAt) comment.createdAt = new Date(comment.createdAt);
          });
        }
      });
      
      return parsedState;
    }
  } catch (error) {
    console.error('Erro ao carregar estado do localStorage:', error);
  }
  return defaultState;
};

const initialState = loadFromLocalStorage();

// Tipos de ações
type KanbanAction =
  | { type: 'ADD_TASK'; payload: { columnId: string; content: string; description?: string; priority?: 'baixa' | 'média' | 'alta', dueDate?: Date, tags?: string[], assignedTo?: string, coverImage?: string } }
  | { type: 'MOVE_TASK'; payload: { source: { columnId: string, index: number }, destination: { columnId: string, index: number } } }
  | { type: 'MOVE_TASK'; payload: { taskId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number } }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; content?: string; description?: string; priority?: 'baixa' | 'média' | 'alta', dueDate?: Date, tags?: string[], assignedTo?: string, coverImage?: string } }
  | { type: 'DELETE_TASK'; payload: { taskId: string; columnId: string } }
  | { type: 'ADD_COLUMN'; payload: { title: string, color?: string, wip?: number } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; title?: string, color?: string, wip?: number } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string } }
  | { type: 'REORDER_COLUMN'; payload: { columnId: string; destinationIndex: number } }
  | { type: 'ADD_TAG'; payload: { taskId: string; tag: string } }
  | { type: 'REMOVE_TAG'; payload: { taskId: string; tag: string } }
  | { type: 'ADD_COMMENT'; payload: { taskId: string; text: string; author: string } }
  | { type: 'DELETE_COMMENT'; payload: { taskId: string; commentId: string } }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: { taskId: string; text: string } }
  | { type: 'TOGGLE_CHECKLIST_ITEM'; payload: { taskId: string; itemId: string } }
  | { type: 'DELETE_CHECKLIST_ITEM'; payload: { taskId: string; itemId: string } }
  | { type: 'ARCHIVE_TASK'; payload: { taskId: string } }
  | { type: 'RESTORE_TASK'; payload: { taskId: string } }
  | { type: 'IMPORT_DATA'; payload: { data: KanbanState } };

// Reducer para gerenciar o estado
const kanbanReducer = (state: KanbanState, action: KanbanAction): KanbanState => {
  let newState = state;
  const now = new Date();

  switch (action.type) {
    case 'ADD_TASK': {
      const { columnId, content, description, priority, dueDate, tags, assignedTo, coverImage } = action.payload;
      const taskId = uuidv4();
      const newTask: Task = {
        id: taskId,
        columnId,
        content,
        description,
        priority,
        dueDate,
        tags: tags || [],
        assignedTo,
        coverImage,
        checklist: [],
        comments: [],
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      const column = state.columns[columnId];
      const newTaskIds = [...column.taskIds, taskId];

      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: newTask,
        },
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      };
      break;
    }

    case 'MOVE_TASK': {
      const payload = action.payload;
      
      // Compatibilidade com o formato antigo e novo
      let source, destination;
      
      if ('source' in payload && 'destination' in payload) {
        // Formato antigo
        source = payload.source;
        destination = payload.destination;
      } else if ('sourceColumnId' in payload && 'destinationColumnId' in payload) {
        // Formato novo
        source = {
          columnId: payload.sourceColumnId,
          index: payload.sourceIndex
        };
        destination = {
          columnId: payload.destinationColumnId,
          index: payload.destinationIndex
        };
      } else {
        return state;
      }
      
      // Se não houver destino, não faz nada
      if (!destination) {
        return state;
      }

      // Se a origem e o destino forem iguais, não faz nada
      if (
        source.columnId === destination.columnId &&
        source.index === destination.index
      ) {
        return state;
      }

      const sourceColumn = state.columns[source.columnId];
      const destinationColumn = state.columns[destination.columnId];
      
      // Verificar limite WIP, se definido
      if (source.columnId !== destination.columnId && 
          destinationColumn.wip && 
          destinationColumn.taskIds.length >= destinationColumn.wip) {
        alert(`Limite de tarefas em andamento (${destinationColumn.wip}) atingido para a coluna "${destinationColumn.title}"`);
        return state;
      }
      
      // Mover na mesma coluna
      if (source.columnId === destination.columnId) {
        const newTaskIds = [...sourceColumn.taskIds];
        const [removed] = newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, removed);

        newState = {
          ...state,
          columns: {
            ...state.columns,
            [source.columnId]: {
              ...sourceColumn,
              taskIds: newTaskIds,
            },
          },
        };
      } else {
        // Mover entre colunas diferentes
        const sourceTaskIds = [...sourceColumn.taskIds];
        const [removed] = sourceTaskIds.splice(source.index, 1);
        
        const destinationTaskIds = [...destinationColumn.taskIds];
        destinationTaskIds.splice(destination.index, 0, removed);

        newState = {
          ...state,
          columns: {
            ...state.columns,
            [source.columnId]: {
              ...sourceColumn,
              taskIds: sourceTaskIds,
            },
            [destination.columnId]: {
              ...destinationColumn,
              taskIds: destinationTaskIds,
            },
          },
        };
      }
      break;
    }

    case 'UPDATE_TASK': {
      const { taskId, content, description, priority, dueDate, tags, assignedTo, coverImage } = action.payload;
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...state.tasks[taskId],
            ...(content !== undefined && { content }),
            ...(description !== undefined && { description }),
            ...(priority !== undefined && { priority }),
            ...(dueDate !== undefined && { dueDate }),
            ...(tags !== undefined && { tags }),
            ...(assignedTo !== undefined && { assignedTo }),
            ...(coverImage !== undefined && { coverImage }),
            updatedAt: now,
          },
        },
      };
      break;
    }

    case 'DELETE_TASK': {
      const { taskId, columnId } = action.payload;
      const column = state.columns[columnId];
      const newTaskIds = column.taskIds.filter(id => id !== taskId);
      
      const { [taskId]: _, ...remainingTasks } = state.tasks;

      newState = {
        ...state,
        tasks: remainingTasks,
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            taskIds: newTaskIds,
          },
        },
      };
      break;
    }

    case 'ADD_COLUMN': {
      const { title, color, wip } = action.payload;
      const newColumnId = uuidv4();
      
      newState = {
        ...state,
        columns: {
          ...state.columns,
          [newColumnId]: {
            id: newColumnId,
            title,
            taskIds: [],
            color,
            wip,
          },
        },
        columnOrder: [...state.columnOrder, newColumnId],
      };
      break;
    }

    case 'UPDATE_COLUMN': {
      const { columnId, title, color, wip } = action.payload;
      
      newState = {
        ...state,
        columns: {
          ...state.columns,
          [columnId]: {
            ...state.columns[columnId],
            ...(title !== undefined && { title }),
            ...(color !== undefined && { color }),
            ...(wip !== undefined && { wip }),
          },
        },
      };
      break;
    }

    case 'DELETE_COLUMN': {
      const { columnId } = action.payload;
      const column = state.columns[columnId];
      
      // Remover todas as tarefas da coluna
      const newTasks = { ...state.tasks };
      column.taskIds.forEach(taskId => {
        delete newTasks[taskId];
      });
      
      const { [columnId]: _, ...remainingColumns } = state.columns;
      const newColumnOrder = state.columnOrder.filter(id => id !== columnId);

      newState = {
        ...state,
        tasks: newTasks,
        columns: remainingColumns,
        columnOrder: newColumnOrder,
      };
      break;
    }

    case 'REORDER_COLUMN': {
      const { columnId, destinationIndex } = action.payload;
      
      // Encontrar a posição atual da coluna
      const columnIndex = state.columnOrder.findIndex(id => id === columnId);
      
      // Se não encontrar a coluna ou o índice for o mesmo, não faz nada
      if (columnIndex === -1 || columnIndex === destinationIndex) {
        return state;
      }
      
      // Criar uma nova ordem de colunas
      const newColumnOrder = [...state.columnOrder];
      
      // Remover a coluna da posição atual
      newColumnOrder.splice(columnIndex, 1);
      
      // Inserir a coluna na nova posição
      newColumnOrder.splice(destinationIndex, 0, columnId);
      
      return {
        ...state,
        columnOrder: newColumnOrder
      };
    }

    case 'ADD_TAG': {
      const { taskId, tag } = action.payload;
      const task = state.tasks[taskId];
      const existingTags = task.tags || [];
      
      if (!existingTags.includes(tag)) {
        newState = {
          ...state,
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...task,
              tags: [...existingTags, tag],
              updatedAt: now,
            },
          },
        };
      } else {
        return state;
      }
      break;
    }

    case 'REMOVE_TAG': {
      const { taskId, tag } = action.payload;
      const task = state.tasks[taskId];
      const existingTags = task.tags || [];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            tags: existingTags.filter(t => t !== tag),
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'ADD_COMMENT': {
      const { taskId, text, author } = action.payload;
      const task = state.tasks[taskId];
      const existingComments = task.comments || [];
      const newComment: Comment = {
        id: uuidv4(),
        text,
        author,
        createdAt: now,
      };
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            comments: [...existingComments, newComment],
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'DELETE_COMMENT': {
      const { taskId, commentId } = action.payload;
      const task = state.tasks[taskId];
      const existingComments = task.comments || [];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            comments: existingComments.filter(comment => comment.id !== commentId),
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'ADD_CHECKLIST_ITEM': {
      const { taskId, text } = action.payload;
      const task = state.tasks[taskId];
      const existingChecklist = task.checklist || [];
      const newItem: ChecklistItem = {
        id: uuidv4(),
        text,
        isComplete: false,
      };
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            checklist: [...existingChecklist, newItem],
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'TOGGLE_CHECKLIST_ITEM': {
      const { taskId, itemId } = action.payload;
      const task = state.tasks[taskId];
      const existingChecklist = task.checklist || [];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            checklist: existingChecklist.map(item => 
              item.id === itemId ? { ...item, isComplete: !item.isComplete } : item
            ),
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'DELETE_CHECKLIST_ITEM': {
      const { taskId, itemId } = action.payload;
      const task = state.tasks[taskId];
      const existingChecklist = task.checklist || [];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            checklist: existingChecklist.filter(item => item.id !== itemId),
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'ARCHIVE_TASK': {
      const { taskId } = action.payload;
      const task = state.tasks[taskId];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            isArchived: true,
            updatedAt: now,
          },
        },
      };
      break;
    }
    
    case 'RESTORE_TASK': {
      const { taskId } = action.payload;
      const task = state.tasks[taskId];
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            isArchived: false,
            updatedAt: now,
          },
        },
      };
      break;
    }

    case 'IMPORT_DATA': {
      newState = action.payload.data;
      break;
    }

    default:
      return state;
  }

  // Salvar no localStorage após cada ação
  try {
    localStorage.setItem('kanbanState', JSON.stringify(newState));
  } catch (error) {
    console.error('Erro ao salvar estado no localStorage:', error);
  }

  return newState;
};

// Interface do contexto
interface KanbanContextProps {
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
  exportData: () => void;
  importData: (data: string) => void;
}

// Criação do contexto
const KanbanContext = createContext<KanbanContextProps | undefined>(undefined);

// Provider component
interface KanbanProviderProps {
  children: ReactNode;
}

export const KanbanProvider: React.FC<KanbanProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Criar um link temporário para download
    const exportFileDefaultName = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData) as KanbanState;
      dispatch({
        type: 'IMPORT_DATA',
        payload: { data },
      });
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      alert('Formato de arquivo inválido. Por favor, selecione um arquivo JSON válido.');
    }
  };

  return (
    <KanbanContext.Provider value={{ state, dispatch, exportData, importData }}>
      {children}
    </KanbanContext.Provider>
  );
};

// Hook para usar o contexto
export const useKanban = (): KanbanContextProps => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban deve ser usado dentro de um KanbanProvider');
  }
  return context;
}; 