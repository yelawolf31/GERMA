import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { TranslationProvider } from './i18n'
import { ToastProvider } from './hooks/useToast'
import { registerSW } from './pwa'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TranslationProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </TranslationProvider>
  </StrictMode>,
)

registerSW()
