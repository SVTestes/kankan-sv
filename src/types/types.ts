export interface ChecklistItem {
  id: string;
  text: string;
  isComplete: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

export type Priority = 'alta' | 'média' | 'baixa';

export interface Task {
  id: string;
  columnId: string;
  content: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  tags?: string[];
  attachments?: string[]; // URLs de arquivos/imagens
  checklist?: ChecklistItem[];
  comments?: Comment[];
  assignedTo?: string; // Nome do usuário atribuído
  coverImage?: string; // URL da imagem de capa
  isArchived?: boolean;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
  color?: string; // Cor de destaque da coluna
  wip?: number; // Work in progress limit
}

export interface KanbanState {
  tasks: {
    [key: string]: Task;
  };
  columns: {
    [key: string]: Column;
  };
  columnOrder: string[];
  userPreferences?: {
    theme: 'light' | 'dark';
    filters: {
      tags: string[];
      assignees: string[];
      priorities: string[];
    };
  };
} 