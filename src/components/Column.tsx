import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Paper, Typography, Button, Box, TextField, IconButton, Badge, Tooltip, InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaletteIcon from '@mui/icons-material/Palette';
import WorkIcon from '@mui/icons-material/Work';
import Task from './Task';
import { Column as ColumnType, Task as TaskType } from '../types/types';
import { useKanban } from '../context/KanbanContext';
import TaskFormDialog from './TaskFormDialog';

interface ColumnProps {
  column: ColumnType;
  tasks: TaskType[];
}

const DEFAULT_COLORS = [
  '#0079BF', // Azul
  '#FF9D2A', // Laranja
  '#61BD4F', // Verde
  '#F2D600', // Amarelo
  '#C377E0', // Roxo
  '#EB5A46', // Vermelho
  '#00C2E0', // Azul claro
  '#51E898', // Verde claro
  '#FF78CB', // Rosa
  '#344563', // Azul escuro
];

const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const { dispatch } = useKanban();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [columnColor, setColumnColor] = useState(column.color || DEFAULT_COLORS[0]);
  const [columnWip, setColumnWip] = useState<number | undefined>(column.wip);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskType | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wipDialogOpen, setWipDialogOpen] = useState(false);
  const [wipValue, setWipValue] = useState<string>(columnWip?.toString() || '');

  const handleOpenSettings = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsAnchorEl(null);
    setSettingsOpen(false);
  };

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          columnId: column.id,
          content: newTaskContent,
        },
      });
      setNewTaskContent('');
      setIsAddingTask(false);
    }
  };

  const handleColumnUpdate = () => {
    if (columnTitle.trim()) {
      dispatch({
        type: 'UPDATE_COLUMN',
        payload: {
          columnId: column.id,
          title: columnTitle,
          color: columnColor,
          wip: columnWip,
        },
      });
      setIsEditingColumn(false);
    }
  };

  const handleDeleteColumn = () => {
    if (window.confirm(`Tem certeza que deseja excluir a coluna "${column.title}"?`)) {
      dispatch({
        type: 'DELETE_COLUMN',
        payload: {
          columnId: column.id,
        },
      });
    }
  };

  const handleOpenTaskForm = () => {
    setCurrentTask(null);
    setTaskFormOpen(true);
  };

  const handleEditTask = (task: TaskType) => {
    setCurrentTask(task);
    setTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setTaskFormOpen(false);
  };

  const handleColorSelect = (color: string) => {
    setColumnColor(color);
    setColorPickerOpen(false);
    
    dispatch({
      type: 'UPDATE_COLUMN',
      payload: {
        columnId: column.id,
        color,
      },
    });
  };

  const handleWipDialogOpen = () => {
    setWipValue(columnWip?.toString() || '');
    setWipDialogOpen(true);
    handleCloseSettings();
  };

  const handleWipDialogClose = () => {
    setWipDialogOpen(false);
  };

  const handleWipSave = () => {
    const newWip = wipValue === '' ? undefined : parseInt(wipValue, 10);
    
    if (wipValue === '' || (newWip !== undefined && !isNaN(newWip) && newWip >= 0)) {
      setColumnWip(newWip);
      
      dispatch({
        type: 'UPDATE_COLUMN',
        payload: {
          columnId: column.id,
          wip: newWip,
        },
      });
      
      setWipDialogOpen(false);
    }
  };

  // Verificar se o limite WIP está sendo atingido
  const isWipExceeded = columnWip !== undefined && tasks.length > columnWip;
  const isWipWarning = columnWip !== undefined && tasks.length === columnWip;

  return (
    <Paper
      sx={{
        minWidth: 280,
        maxWidth: 350,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        pb: 2,
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <Box
        p={1.5}
        pb={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          bgcolor: columnColor,
          color: 'white',
          borderRadius: '3px 3px 0 0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {isEditingColumn ? (
          <TextField
            value={columnTitle}
            onChange={(e) => setColumnTitle(e.target.value)}
            variant="outlined"
            size="small"
            autoFocus
            fullWidth
            InputProps={{
              sx: { 
                color: 'white', 
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'rgba(255,255,255,0.5)' 
                },
                '&:hover .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'rgba(255,255,255,0.8)' 
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'white' 
                }
              }
            }}
            onBlur={handleColumnUpdate}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleColumnUpdate();
              }
            }}
          />
        ) : (
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight="600" sx={{ mr: 1 }}>
              {column.title}
            </Typography>
            
            {columnWip !== undefined && (
              <Tooltip title={`Limite WIP: ${tasks.length}/${columnWip}`}>
                <Badge 
                  badgeContent={`${tasks.length}/${columnWip}`} 
                  color={isWipExceeded ? "error" : isWipWarning ? "warning" : "primary"}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}
                >
                  <WorkIcon fontSize="small" />
                </Badge>
              </Tooltip>
            )}
          </Box>
        )}
        <Box>
          <IconButton 
            size="small" 
            onClick={handleOpenSettings} 
            sx={{ color: 'white' }}
            aria-label="Configurações da coluna"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            anchorEl={settingsAnchorEl}
            open={settingsOpen}
            onClose={handleCloseSettings}
            MenuListProps={{
              'aria-labelledby': 'column-settings',
            }}
          >
            <MenuItem onClick={() => { setIsEditingColumn(true); handleCloseSettings(); }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar título
            </MenuItem>
            <MenuItem onClick={() => { setColorPickerOpen(true); handleCloseSettings(); }}>
              <PaletteIcon fontSize="small" sx={{ mr: 1 }} />
              Mudar cor
            </MenuItem>
            <MenuItem onClick={handleWipDialogOpen}>
              <WorkIcon fontSize="small" sx={{ mr: 1 }} />
              {columnWip ? `Limite WIP (${columnWip})` : 'Definir limite WIP'}
            </MenuItem>
            <MenuItem onClick={handleDeleteColumn} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir coluna
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
        <DialogTitle>Escolha uma cor</DialogTitle>
        <DialogContent>
          <Box 
            display="flex" 
            gap={1} 
            flexWrap="wrap"
            justifyContent="center"
            sx={{ p: 1, maxWidth: 300 }}
          >
            {DEFAULT_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorSelect(color)}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: color,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: color === columnColor ? '2px solid #000' : '2px solid transparent',
                  '&:hover': {
                    opacity: 0.8,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={wipDialogOpen} onClose={handleWipDialogClose}>
        <DialogTitle>Definir limite de tarefas em andamento (WIP)</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Limite WIP"
              type="number"
              InputProps={{
                inputProps: { min: 0 },
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkIcon />
                  </InputAdornment>
                ),
              }}
              helperText="Deixe em branco para remover o limite"
              value={wipValue}
              onChange={(e) => setWipValue(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWipDialogClose}>Cancelar</Button>
          <Button onClick={handleWipSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minHeight: 100,
              p: 1,
              pt: 1.5,
              overflow: 'auto',
              backgroundColor: snapshot.isDraggingOver 
                ? 'rgba(0, 121, 191, 0.1)'  // Azul claro ao arrastar
                : '#f5f5f5',
              transition: 'background-color 0.2s ease',
            }}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <Box 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  borderRadius: 1,
                }}
              >
                Arraste tarefas para aqui ou adicione uma nova
              </Box>
            )}
            
            {tasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                index={index}
                columnId={column.id}
                onEdit={handleEditTask}
              />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      {isAddingTask ? (
        <Box p={1.5} pt={0.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Digite o título da tarefa"
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            autoFocus
            onBlur={() => {
              if (!newTaskContent.trim()) {
                setIsAddingTask(false);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
            sx={{ mb: 1 }}
          />
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleAddTask}
              disabled={!newTaskContent.trim()}
            >
              Adicionar
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsAddingTask(false)}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      ) : (
        <Box p={1.5} pt={0.5} display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingTask(true)}
            fullWidth
            size="small"
            color={isWipExceeded ? "error" : "primary"}
            disabled={isWipExceeded}
          >
            {isWipExceeded 
              ? `Limite WIP (${columnWip}) atingido` 
              : "Adicionar Tarefa"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleOpenTaskForm}
            fullWidth
            size="small"
            color={isWipExceeded ? "error" : "primary"}
            disabled={isWipExceeded}
          >
            Detalhada
          </Button>
        </Box>
      )}
      
      <TaskFormDialog
        open={taskFormOpen}
        onClose={handleCloseTaskForm}
        task={currentTask}
        columnId={column.id}
      />
    </Paper>
  );
};

export default Column; 