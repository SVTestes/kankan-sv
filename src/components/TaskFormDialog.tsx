import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Stack,
  Autocomplete,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Divider,
  Paper,
  Avatar,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PersonIcon from '@mui/icons-material/Person';
import { Task, ChecklistItem, Comment } from '../types/types';
import { useKanban } from '../context/KanbanContext';

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  columnId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && children}
    </div>
  );
}

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  onClose,
  task,
  columnId,
}) => {
  const { state, dispatch } = useKanban();
  const [tabValue, setTabValue] = useState(0);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'média' | 'alta' | ''>('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  
  // Lista de verificação
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  // Comentários
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('Usuário');

  // Coletar todas as tags existentes para sugestões
  const allTags = Array.from(
    new Set(
      Object.values(state.tasks).flatMap(task => task.tags || [])
    )
  ).sort();

  useEffect(() => {
    if (task) {
      setContent(task.content);
      setDescription(task.description || '');
      setPriority(task.priority || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setTags(task.tags || []);
      setCoverImage(task.coverImage || '');
      setAssignedTo(task.assignedTo || '');
      setChecklist(task.checklist || []);
      setComments(task.comments || []);
      setTabValue(0); // Reset para a primeira aba ao abrir
    } else {
      setContent('');
      setDescription('');
      setPriority('');
      setDueDate(null);
      setTags([]);
      setCoverImage('');
      setAssignedTo('');
      setChecklist([]);
      setComments([]);
      setTabValue(0);
    }
  }, [task, open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };
  
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Math.random().toString(36).substring(2, 9), // ID simples para o formulário
        text: newChecklistItem.trim(),
        isComplete: false
      };
      setChecklist([...checklist, newItem]);
      setNewChecklistItem('');
    }
  };
  
  const handleToggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map(item => 
        item.id === itemId ? { ...item, isComplete: !item.isComplete } : item
      )
    );
  };
  
  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId));
  };
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Math.random().toString(36).substring(2, 9),
        text: newComment.trim(),
        author: commentAuthor,
        createdAt: new Date()
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    }
  };
  
  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleSubmit = () => {
    if (content.trim()) {
      if (task) {
        // Editar tarefa existente
        dispatch({
          type: 'UPDATE_TASK',
          payload: {
            taskId: task.id,
            content,
            description: description || undefined,
            priority: priority || undefined,
            dueDate: dueDate || undefined,
            tags,
            coverImage: coverImage || undefined,
            assignedTo: assignedTo || undefined,
          },
        });
        
        // Atualizar itens da lista de verificação
        // Primeiro remover todos os itens antigos e depois adicionar os novos
        if (task.checklist) {
          task.checklist.forEach(item => {
            dispatch({
              type: 'DELETE_CHECKLIST_ITEM',
              payload: { taskId: task.id, itemId: item.id }
            });
          });
        }
        
        checklist.forEach(item => {
          dispatch({
            type: 'ADD_CHECKLIST_ITEM',
            payload: { taskId: task.id, text: item.text }
          });
          
          if (item.isComplete) {
            dispatch({
              type: 'TOGGLE_CHECKLIST_ITEM',
              payload: { taskId: task.id, itemId: item.id }
            });
          }
        });
        
        // Atualizar comentários
        // Como os comentários são registros históricos, eles não são substituídos
        // Aqui apenas adicionamos novos comentários que foram criados no formulário
        const existingCommentIds = (task.comments || []).map(c => c.id);
        comments
          .filter(c => !existingCommentIds.includes(c.id))
          .forEach(comment => {
            dispatch({
              type: 'ADD_COMMENT',
              payload: { 
                taskId: task.id, 
                text: comment.text, 
                author: comment.author
              }
            });
          });
        
      } else {
        // Adicionar nova tarefa
        const addTaskAction = {
          type: 'ADD_TASK' as const,
          payload: {
            columnId,
            content,
            description: description || undefined,
            priority: priority || undefined,
            dueDate: dueDate || undefined,
            tags,
            coverImage: coverImage || undefined,
            assignedTo: assignedTo || undefined,
          },
        };
        
        dispatch(addTaskAction);
        
        // Como é uma nova tarefa, precisamos buscar o ID que foi gerado
        // Isso seria melhor se o action retornasse o ID gerado, mas vamos usar este workaround
        // Na prática, você poderia adaptar o context para retornar o ID da tarefa criada
        setTimeout(() => {
          // Encontrar a tarefa recém-criada (a última da coluna)
          const column = state.columns[columnId];
          if (column && column.taskIds.length > 0) {
            const newTaskId = column.taskIds[column.taskIds.length - 1];
            
            // Adicionar itens da lista de verificação
            checklist.forEach(item => {
              dispatch({
                type: 'ADD_CHECKLIST_ITEM',
                payload: { taskId: newTaskId, text: item.text }
              });
              
              if (item.isComplete) {
                dispatch({
                  type: 'TOGGLE_CHECKLIST_ITEM',
                  payload: { taskId: newTaskId, itemId: item.id }
                });
              }
            });
            
            // Adicionar comentários
            comments.forEach(comment => {
              dispatch({
                type: 'ADD_COMMENT',
                payload: { 
                  taskId: newTaskId, 
                  text: comment.text, 
                  author: comment.author
                }
              });
            });
          }
        }, 100);
      }
      onClose();
    }
  };

  // Estatísticas da lista de verificação
  const checklistStats = {
    total: checklist.length,
    completed: checklist.filter(item => item.isComplete).length,
    percent: checklist.length > 0 
      ? Math.round((checklist.filter(item => item.isComplete).length / checklist.length) * 100) 
      : 0
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {task ? 'Editar Tarefa' : 'Nova Tarefa'}
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="task tabs">
            <Tab icon={<DescriptionIcon />} iconPosition="start" label="Detalhes" id="task-tab-0" />
            <Tab icon={<ChecklistIcon />} iconPosition="start" label="Lista de Verificação" id="task-tab-1" />
            <Tab icon={<CommentIcon />} iconPosition="start" label="Comentários" id="task-tab-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            
            <TextField
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Adicione uma descrição detalhada para esta tarefa..."
            />
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
                <InputLabel id="priority-label">Prioridade</InputLabel>
                <Select
                  labelId="priority-label"
                  value={priority}
                  label="Prioridade"
                  onChange={(e) => setPriority(e.target.value as 'baixa' | 'média' | 'alta' | '')}
                >
                  <MenuItem value="">
                    <em>Nenhuma</em>
                  </MenuItem>
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="média">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data de vencimento"
                  value={dueDate}
                  onChange={(newValue: Date | null) => setDueDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, sx: { minWidth: 200, flexGrow: 1 } } }}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
            </Box>
            
            <TextField
              label="Atribuído a"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              fullWidth
              placeholder="Digite o nome da pessoa responsável"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="URL da imagem de capa"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              fullWidth
              placeholder="Cole a URL de uma imagem para usar como capa"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ImageIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Gestão de etiquetas */}
            <Box>
              <Autocomplete
                value={newTag}
                onChange={(event, newValue) => {
                  setNewTag(newValue || '');
                }}
                inputValue={newTag}
                onInputChange={(event, newInputValue) => {
                  setNewTag(newInputValue);
                }}
                options={allTags.filter(tag => !tags.includes(tag))}
                freeSolo
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Adicionar etiqueta" 
                    fullWidth
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                )}
              />
              <Button 
                onClick={handleAddTag} 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1, mb: 2 }}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
              >
                Adicionar Etiqueta
              </Button>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6" component="div">
                Lista de Verificação
              </Typography>
              
              {checklist.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {checklistStats.completed}/{checklistStats.total} concluídos ({checklistStats.percent}%)
                </Typography>
              )}
            </Box>
            
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Adicionar um item"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleAddChecklistItem}
                disabled={!newChecklistItem.trim()}
                startIcon={<AddIcon />}
              >
                Adicionar
              </Button>
            </Box>
            
            {checklist.length > 0 ? (
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {checklist.map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteChecklistItem(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                    disablePadding
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={item.isComplete}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        textDecoration: item.isComplete ? 'line-through' : 'none',
                        color: item.isComplete ? 'text.secondary' : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nenhum item na lista de verificação. Adicione itens acima.
              </Typography>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" component="div">
              Comentários
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Adicione um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <TextField
                  label="Seu nome"
                  size="small"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  sx={{ width: 200 }}
                />
                
                <Button 
                  variant="contained" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !commentAuthor.trim()}
                >
                  Adicionar Comentário
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            {comments.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {comments.map((comment, index) => (
                  <Paper key={comment.id || index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                          {comment.author.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle2">{comment.author}</Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.createdAt)}
                        </Typography>
                        <IconButton size="small" onClick={() => handleDeleteComment(comment.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2">{comment.text}</Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </Typography>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!content.trim()}
        >
          {task ? 'Atualizar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskFormDialog; 