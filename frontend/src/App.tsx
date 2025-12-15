import { useState, useEffect } from 'react'
import { Stack } from '@mui/material'
import { useLocalStorageState } from 'ahooks'
import './App.css'
import { Search, Editor } from '@/components'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';

function App() {


  const [inputValue, setInputValue] = useState('')
  const [storedValue, setStoredValue] = useLocalStorageState('app-name', {
    defaultValue: 'Electron React App',
  })


  return (
    <NotificationsProvider slotProps={{
      snackbar: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        autoHideDuration: 2000,
      },
    }} >
      <ThemeProvider theme={theme}>
        <Stack spacing={2}>
          <Search onSearch={setInputValue} />
          <Editor onSave={setStoredValue} />
        </Stack>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
