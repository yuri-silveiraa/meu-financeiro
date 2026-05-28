import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installBrowserApiMock } from './utils/browserApiMock.js'
import './styles/index.css'

installBrowserApiMock()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
