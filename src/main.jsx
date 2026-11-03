import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeKeycloak } from './services/keycloak.js'

const root = createRoot(document.getElementById('root'))

initializeKeycloak()
  .then((authenticated) => {
    if (!authenticated) return

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('Não foi possível iniciar a autenticação:', error)
    root.render(
      <main role="alert">
        Não foi possível conectar ao serviço de autenticação. Tente novamente
        mais tarde.
      </main>,
    )
  })
