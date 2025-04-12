import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Box, Button, TextField, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Typography, alpha, Menu, MenuItem, InputAdornment, Divider, Badge } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import LabelIcon from '@mui/icons-material/Label';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import SortIcon from '@mui/icons-material/Sort';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ClearIcon from '@mui/icons-material/Clear';
import Column from './Column';
import { useKanban } from '../context/KanbanContext';
import { Column as ColumnType, Task as TaskType, Priority } from '../types/types';

const KanbanBoard: React.FC = () => {
  const { state, dispatch } = useKanban();
  const [columnTitle, setColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = React.useState<null | HTMLElement>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [showCardWithNoAssignee, setShowCardWithNoAssignee] = useState(true);
  const [dueDateFilter, setDueDateFilter] = useState<'today' | 'week' | 'overdue' | null>(null);
  const [sortOption, setSortOption] = useState<'priority' | 'dueDate' | 'title' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Obtém todas as tags e pessoas atribuídas únicas para filtros
  const allTags = Array.from(
    new Set(
      Object.values(state.tasks)
        .flatMap(task => task.tags || [])
        .filter(Boolean)
    )
  );

  const allAssignees = Array.from(
    new Set(
      Object.values(state.tasks)
        .map(task => task.assignedTo)
        .filter(Boolean) as string[]
    )
  );

  const handleAddColumn = () => {
    if (columnTitle.trim()) {
      dispatch({
        type: 'ADD_COLUMN',
        payload: {
          title: columnTitle,
        },
      });
      setColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    // Se não houver destino válido, não faz nada
    if (!destination) {
      return;
    }

    // Se o destino for o mesmo que a origem, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Movendo colunas
    if (type === 'column') {
      dispatch({
        type: 'REORDER_COLUMN',
        payload: {
          columnId: draggableId,
          destinationIndex: destination.index,
        },
      });
      return;
    }

    // Movendo tarefas
    dispatch({
      type: 'MOVE_TASK',
      payload: {
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      },
    });
  };

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setPriorityFilter(null);
    setTagFilter(null);
    setAssigneeFilter(null);
    setDueDateFilter(null);
    setSortOption(null);
    setSortDirection('asc');
    setShowCompletedTasks(true);
    setShowCardWithNoAssignee(true);
  };

  // Verifica se algum filtro está ativo
  const isFilterActive = 
    searchTerm || 
    priorityFilter !== null || 
    tagFilter !== null || 
    assigneeFilter !== null || 
    !showCompletedTasks ||
    !showCardWithNoAssignee ||
    dueDateFilter !== null ||
    sortOption !== null;

  // Filtra e ordena as tarefas baseado nos critérios
  const getFilteredTasks = (tasks: TaskType[]): TaskType[] => {
    // Filtrar por termo de busca
    let filtered = tasks.filter(task => {
      const searchMatch = !searchTerm || 
        task.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const priorityMatch = priorityFilter === null || task.priority === priorityFilter;
      
      const tagMatch = tagFilter === null || task.tags?.includes(tagFilter);
      
      const assigneeMatch = assigneeFilter === null || 
        (assigneeFilter === 'unassigned' 
          ? !task.assignedTo 
          : task.assignedTo === assigneeFilter);
      
      const completedMatch = showCompletedTasks || !task.completed;
      
      const noAssigneeMatch = showCardWithNoAssignee || task.assignedTo;

      let dueDateMatch = true;
      if (dueDateFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
        
        if (taskDueDate) {
          taskDueDate.setHours(0, 0, 0, 0);
          
          if (dueDateFilter === 'today') {
            dueDateMatch = taskDueDate.getTime() === today.getTime();
          } else if (dueDateFilter === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            dueDateMatch = taskDueDate >= today && taskDueDate <= nextWeek;
          } else if (dueDateFilter === 'overdue') {
            dueDateMatch = taskDueDate < today;
          }
        } else {
          dueDateMatch = false;
        }
      }
      
      return searchMatch && priorityMatch && tagMatch && assigneeMatch && completedMatch && noAssigneeMatch && dueDateMatch;
    });

    // Ordenar resultados
    if (sortOption) {
      filtered.sort((a, b) => {
        if (sortOption === 'priority') {
          const priorityOrder: Record<string, number> = { 
            alta: 3, 
            média: 2, 
            baixa: 1, 
            null: 0 
          };
          const aValue = priorityOrder[a.priority || 'null'];
          const bValue = priorityOrder[b.priority || 'null'];
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (sortOption === 'dueDate') {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        } else if (sortOption === 'title') {
          const aTitle = a.content.toLowerCase();
          const bTitle = b.content.toLowerCase();
          return sortDirection === 'asc' 
            ? aTitle.localeCompare(bTitle)
            : bTitle.localeCompare(aTitle);
        }
        return 0;
      });
    }

    return filtered;
  };

  // Obtém as tarefas filtradas por coluna
  const getTasksByColumn = (columnId: string): TaskType[] => {
    const tasks = Object.values(state.tasks).filter(task => task.columnId === columnId);
    return getFilteredTasks(tasks);
  };

  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme => theme.palette.background.default,
      }}
    >
      {/* Barra de ferramentas superior */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: theme => alpha(theme.palette.primary.main, 0.08),
          mb: 2,
          borderRadius: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewKanbanIcon />
            Kanban
          </Typography>
          
          <Tooltip title="Favoritar este quadro">
            <IconButton size="small">
              <StarBorderIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Campo de busca */}
          <TextField
            placeholder="Buscar tarefas..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: 2 }
            }}
            sx={{ minWidth: 220 }}
          />

          {/* Botão de filtro */}
          <Tooltip title="Filtrar tarefas">
            <Badge 
              color="primary" 
              variant="dot" 
              invisible={!isFilterActive}
            >
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleOpenFilterMenu}
                size="small"
                color={isFilterActive ? "primary" : "inherit"}
              >
                Filtros
              </Button>
            </Badge>
          </Tooltip>

          {/* Menu de filtros */}
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleCloseFilterMenu}
            PaperProps={{
              sx: { 
                minWidth: 250, 
                maxHeight: '80vh',
                p: 1
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
              Filtros
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <MenuItem 
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              sx={{ 
                bgcolor: !showCompletedTasks ? alpha('#61BD4F', 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: !showCompletedTasks ? alpha('#61BD4F', 0.2) : undefined,
                }
              }}
            >
              <CheckBoxIcon sx={{ mr: 1, color: !showCompletedTasks ? '#61BD4F' : 'inherit' }} />
              {showCompletedTasks ? 'Ocultar tarefas concluídas' : 'Mostrando apenas não concluídas'}
            </MenuItem>

            <MenuItem 
              onClick={() => setShowCardWithNoAssignee(!showCardWithNoAssignee)}
              sx={{ 
                bgcolor: !showCardWithNoAssignee ? alpha('#61BD4F', 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: !showCardWithNoAssignee ? alpha('#61BD4F', 0.2) : undefined,
                }
              }}
            >
              <PersonIcon sx={{ mr: 1, color: !showCardWithNoAssignee ? '#61BD4F' : 'inherit' }} />
              {showCardWithNoAssignee ? 'Ocultar tarefas sem responsável' : 'Mostrando apenas com responsável'}
            </MenuItem>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>
              Prioridade
            </Typography>

            {(['alta', 'média', 'baixa'] as Priority[]).map((priority) => (
              <MenuItem 
                key={priority}
                onClick={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
                sx={{ 
                  bgcolor: priorityFilter === priority ? alpha('#61BD4F', 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: priorityFilter === priority ? alpha('#61BD4F', 0.2) : undefined,
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 14, 
                    height: 14, 
                    borderRadius: '50%',
                    mr: 1,
                    bgcolor: 
                      priority === 'alta' ? '#EB5A46' : 
                      priority === 'média' ? '#F2D600' :
                      '#61BD4F'
                  }} 
                />
                {priority === 'alta' ? 'Alta' : priority === 'média' ? 'Média' : 'Baixa'}
              </MenuItem>
            ))}

            {allTags.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>
                  Etiquetas
                </Typography>
                {allTags.map(tag => (
                  <MenuItem 
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    sx={{ 
                      bgcolor: tagFilter === tag ? alpha('#61BD4F', 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: tagFilter === tag ? alpha('#61BD4F', 0.2) : undefined,
                      }
                    }}
                  >
                    <LabelIcon sx={{ mr: 1, color: tagFilter === tag ? '#61BD4F' : 'inherit' }} />
                    {tag}
                  </MenuItem>
                ))}
              </>
            )}

            {allAssignees.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>
                  Responsáveis
                </Typography>
                <MenuItem 
                  onClick={() => setAssigneeFilter(assigneeFilter === 'unassigned' ? null : 'unassigned')}
                  sx={{ 
                    bgcolor: assigneeFilter === 'unassigned' ? alpha('#61BD4F', 0.1) : 'transparent',
                    '&:hover': {
                      bgcolor: assigneeFilter === 'unassigned' ? alpha('#61BD4F', 0.2) : undefined,
                    }
                  }}
                >
                  <PersonIcon sx={{ mr: 1, color: assigneeFilter === 'unassigned' ? '#61BD4F' : 'inherit' }} />
                  Sem responsável
                </MenuItem>
                {allAssignees.map(assignee => (
                  <MenuItem 
                    key={assignee}
                    onClick={() => setAssigneeFilter(assigneeFilter === assignee ? null : assignee)}
                    sx={{ 
                      bgcolor: assigneeFilter === assignee ? alpha('#61BD4F', 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: assigneeFilter === assignee ? alpha('#61BD4F', 0.2) : undefined,
                      }
                    }}
                  >
                    <PersonIcon sx={{ mr: 1, color: assigneeFilter === assignee ? '#61BD4F' : 'inherit' }} />
                    {assignee}
                  </MenuItem>
                ))}
              </>
            )}

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>
              Data de Vencimento
            </Typography>

            {(['today', 'week', 'overdue'] as const).map((dateFilter) => (
              <MenuItem 
                key={dateFilter}
                onClick={() => setDueDateFilter(dueDateFilter === dateFilter ? null : dateFilter)}
                sx={{ 
                  bgcolor: dueDateFilter === dateFilter ? alpha('#61BD4F', 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: dueDateFilter === dateFilter ? alpha('#61BD4F', 0.2) : undefined,
                  }
                }}
              >
                <DateRangeIcon sx={{ mr: 1, color: dueDateFilter === dateFilter ? '#61BD4F' : 'inherit' }} />
                {dateFilter === 'today' ? 'Hoje' : 
                 dateFilter === 'week' ? 'Próxima semana' : 
                 'Atrasadas'}
              </MenuItem>
            ))}

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 0.5 }}>
              Ordenação
            </Typography>

            {(['priority', 'dueDate', 'title'] as const).map((option) => (
              <MenuItem 
                key={option}
                onClick={() => {
                  // Se já estiver selecionado, alterna a direção. Caso contrário, define a nova opção
                  if (sortOption === option) {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortOption(option);
                    setSortDirection('asc');
                  }
                }}
                sx={{ 
                  bgcolor: sortOption === option ? alpha('#61BD4F', 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: sortOption === option ? alpha('#61BD4F', 0.2) : undefined,
                  }
                }}
              >
                <SortIcon sx={{ 
                  mr: 1, 
                  color: sortOption === option ? '#61BD4F' : 'inherit',
                  transform: sortOption === option && sortDirection === 'desc' ? 'rotate(180deg)' : 'none'
                }} />
                {option === 'priority' ? 'Por prioridade' : 
                 option === 'dueDate' ? 'Por data de vencimento' : 
                 'Por título'}
              </MenuItem>
            ))}

            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={clearAllFilters}
                disabled={!isFilterActive}
              >
                Limpar filtros
              </Button>
            </Box>
          </Menu>
        </Box>
      </Paper>

      {/* Área principal do quadro */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          p: 1,
          gap: 2,
          alignItems: 'flex-start',
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          {state.columnOrder.map((columnId) => {
            const column = state.columns[columnId];
            const columnTasks = getTasksByColumn(columnId);
            return (
              <Column key={columnId} column={column} tasks={columnTasks} />
            );
          })}
        </DragDropContext>

        {isAddingColumn ? (
          <Paper sx={{ minWidth: 280, maxWidth: 350, p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Digite o título da coluna"
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              autoFocus
              sx={{ mb: 1 }}
              onBlur={() => {
                if (!columnTitle.trim()) {
                  setIsAddingColumn(false);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddColumn();
                }
              }}
            />
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddColumn}
                disabled={!columnTitle.trim()}
              >
                Adicionar
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsAddingColumn(false)}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        ) : (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingColumn(true)}
            sx={{
              minWidth: 150,
              minHeight: 50,
              alignSelf: 'flex-start',
              whiteSpace: 'nowrap',
            }}
          >
            Adicionar Coluna
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default KanbanBoard; 