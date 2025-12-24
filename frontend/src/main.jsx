import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import { MenuProvider } from './context/MenuContext'
import { PlayerUIProvider } from './context/PlayerUIContext'
import './styles/index.css'
import './styles/fonts.css'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <MenuProvider>
          <PlayerUIProvider>
            <App />
          </PlayerUIProvider>
        </MenuProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(err => console.error('SW registration failed', err))
  })
}
