import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import KanbanBoard from './components/KanbanBoard';
import { KanbanProvider } from './context/KanbanContext';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0079BF', // Azul Planka/Trello
      light: '#4C9AFF',
      dark: '#026AA7',
    },
    secondary: {
      main: '#EB5A46', // Vermelho Planka/Trello
      light: '#FF7452',
      dark: '#C64A3A',
    },
    background: {
      default: '#F5F7F8', // Fundo cinza claro como no Planka
      paper: '#FFFFFF',
    },
    success: {
      main: '#61BD4F', // Verde Planka/Trello
    },
    warning: {
      main: '#F2D600', // Amarelo Planka/Trello
    },
    error: {
      main: '#EB5A46', // Vermelho Planka/Trello
    },
    info: {
      main: '#0079BF', // Azul Planka/Trello
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 3,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 rgba(9, 30, 66, 0.25)',
          borderRadius: '3px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: '3px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <KanbanProvider>
        <div className="App" style={{ height: '100vh' }}>
          <KanbanBoard />
        </div>
      </KanbanProvider>
    </ThemeProvider>
  );
}

export default App;
