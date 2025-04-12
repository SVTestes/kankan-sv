import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Button,
  Paper,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useKanban } from '../context/KanbanContext';

interface KanbanFiltersProps {
  textFilter: string;
  setTextFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  tagFilters: string[];
  setTagFilters: (tags: string[]) => void;
}

const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  textFilter,
  setTextFilter,
  priorityFilter,
  setPriorityFilter,
  tagFilters,
  setTagFilters,
}) => {
  const { state, exportData, importData } = useKanban();
  const [open, setOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Coletar todas as tags existentes
  const allTags = Array.from(
    new Set(
      Object.values(state.tasks).flatMap(task => task.tags || [])
    )
  ).sort();

  const handleClearFilters = () => {
    setTextFilter('');
    setPriorityFilter('');
    setTagFilters([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importData(content);
      };
      reader.readAsText(file);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      setFileInputKey(prev => prev + 1);
    }
  };

  return (
    <Paper sx={{ mb: 2, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" mr={1}>Filtros</Typography>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            color={open ? 'primary' : 'default'}
          >
            <FilterListIcon />
          </IconButton>
        </Box>
        
        <Box>
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            id="import-json"
            onChange={handleFileUpload}
            key={fileInputKey}
          />
          <label htmlFor="import-json">
            <Button
              component="span"
              startIcon={<FileUploadIcon />}
              size="small"
              sx={{ mr: 1 }}
            >
              Importar
            </Button>
          </label>
          
          <Button
            startIcon={<FileDownloadIcon />}
            size="small"
            onClick={exportData}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      <Collapse in={open}>
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
          <TextField
            label="Pesquisar tarefas"
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Digite para pesquisar..."
          />
          
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="priority-filter-label">Prioridade</InputLabel>
              <Select
                labelId="priority-filter-label"
                value={priorityFilter}
                label="Prioridade"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="baixa">Baixa</MenuItem>
                <MenuItem value="média">Média</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              size="small"
              options={allTags}
              value={tagFilters}
              onChange={(_, newValue) => setTagFilters(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Etiquetas" placeholder="Selecione..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    label={option} 
                    size="small" 
                    {...getTagProps({ index })} 
                  />
                ))
              }
              sx={{ flexGrow: 1 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
            >
              Limpar
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default KanbanFilters; 