import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.ts'
import { CssBaseline, ThemeProvider } from '@mui/material'
import yellowishTheme from './theme.ts'
import { AuthProvider } from './context/Authcontext.tsx'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <AuthProvider>
      <ThemeProvider theme={yellowishTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </Provider>,
)
