import { useState, useEffect } from 'react'
import { Button, Card, Typography, Box, TextField, Stack } from '@mui/material'
import { useLocalStorageState } from 'ahooks'
import './App.css'
import { Search, Editor } from '@/components'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'

function App() {
  const [count, setCount] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [storedValue, setStoredValue] = useLocalStorageState('app-name', {
    defaultValue: 'Electron React App',
  })


  return (
    <ThemeProvider theme={theme}>
      <Stack spacing={2}>
        <Search onSearch={setInputValue} />
        <Editor onSave={setStoredValue} />
      </Stack>
    </ThemeProvider>
  )
}

export default App
