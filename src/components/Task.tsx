import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  CardMedia,
  LinearProgress,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CommentIcon from '@mui/icons-material/Comment';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArchiveIcon from '@mui/icons-material/Archive';
import { Task as TaskType } from '../types/types';
import { useKanban } from '../context/KanbanContext';

interface TaskProps {
  task: TaskType;
  index: number;
  columnId: string;
  onEdit: (task: TaskType) => void;
}

const priorityColors = {
  'baixa': '#61BD4F', // Verde
  'média': '#F2D600', // Amarelo
  'alta': '#EB5A46', // Vermelho
};

const Task: React.FC<TaskProps> = ({ task, index, columnId, onEdit }) => {
  const { dispatch } = useKanban();
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    dispatch({
      type: 'DELETE_TASK',
      payload: { taskId: task.id, columnId },
    });
  };

  const handleArchive = () => {
    dispatch({
      type: 'ARCHIVE_TASK',
      payload: { taskId: task.id },
    });
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };
  
  // Calcular a porcentagem de conclusão da lista de verificação
  const getChecklistProgress = () => {
    if (!task.checklist || task.checklist.length === 0) return 0;
    
    const completedItems = task.checklist.filter(item => item.isComplete).length;
    return Math.round((completedItems / task.checklist.length) * 100);
  };
  
  const checklistProgress = getChecklistProgress();
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const hasComments = task.comments && task.comments.length > 0;
  const isDueSoon = task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime() + (3 * 24 * 60 * 60 * 1000); // 3 dias
  const isPastDue = task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime();

  if (task.isArchived) {
    return null; // Não mostrar tarefas arquivadas
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            marginBottom: 2,
            backgroundColor: snapshot.isDragging ? '#f5f5f5' : 'white',
            boxShadow: snapshot.isDragging ? 3 : 1,
            position: 'relative',
            overflow: 'visible',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {task.coverImage && (
            <CardMedia
              component="img"
              height="140"
              image={task.coverImage}
              alt="Imagem de capa"
              sx={{ borderBottom: '1px solid #eee' }}
            />
          )}
          <CardContent sx={{ p: 2, pb: '8px !important' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle1" component="div" sx={{ 
                flexGrow: 1, 
                fontWeight: 600,
                wordBreak: 'break-word'
              }}>
                {task.content}
              </Typography>
              <Box sx={{ 
                opacity: isHovered ? 1 : 0, 
                transition: 'opacity 0.2s',
                position: 'absolute',
                top: 5,
                right: 5,
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '4px',
                padding: '2px'
              }}>
                <IconButton size="small" onClick={() => onEdit(task)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleArchive}>
                  <ArchiveIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleDelete} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            {hasChecklist && task.checklist && (
              <Box mt={1} mb={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {task.checklist.filter(item => item.isComplete).length}/{task.checklist.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {checklistProgress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={checklistProgress} 
                  color={checklistProgress === 100 ? "success" : "primary"}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#E0E0E0' 
                  }}
                />
              </Box>
            )}
            
            <Box display="flex" gap={0.5} flexWrap="wrap" mt={1} alignItems="center">
              {task.priority && (
                <Chip 
                  label={task.priority} 
                  size="small" 
                  sx={{ 
                    height: 20,
                    bgcolor: priorityColors[task.priority],
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }} 
                />
              )}
              
              {task.dueDate && (
                <Tooltip title={formatDate(task.dueDate)}>
                  <Chip 
                    icon={<AccessTimeIcon fontSize="small" />}
                    label={formatDate(task.dueDate)}
                    size="small" 
                    color={isPastDue ? "error" : isDueSoon ? "warning" : "default"}
                    variant="outlined" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: isPastDue ? 600 : 400
                    }}
                  />
                </Tooltip>
              )}
              
              {task.assignedTo && (
                <Tooltip title={`Atribuído a: ${task.assignedTo}`}>
                  <Chip
                    avatar={
                      <Avatar sx={{ width: 16, height: 16 }}>
                        {task.assignedTo.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={task.assignedTo}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
              
              {hasChecklist && task.checklist && (
                <Tooltip title={`Lista de verificação: ${checklistProgress}% concluída`}>
                  <Badge badgeContent={task.checklist.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 14, minWidth: 14 } }}>
                    <CheckBoxIcon fontSize="small" color={checklistProgress === 100 ? "success" : "action"} />
                  </Badge>
                </Tooltip>
              )}
              
              {hasComments && task.comments && (
                <Tooltip title={`${task.comments.length} comentário(s)`}>
                  <Badge badgeContent={task.comments.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 14, minWidth: 14 } }}>
                    <CommentIcon fontSize="small" color="action" />
                  </Badge>
                </Tooltip>
              )}
            </Box>
            
            {/* Tags da tarefa */}
            {task.tags && task.tags.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                {task.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default Task; 