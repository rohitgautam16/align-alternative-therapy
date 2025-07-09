import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import { MenuProvider } from './context/MenuContext'
import { PlayerUIProvider } from './context/PlayerUIContext'
import AuthProvider from 'react-auth-kit';
import { authStore } from './authStore'
import './styles/index.css'
import './styles/fonts.css'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider
        store={authStore}
        authType="cookie"
        authName="_auth"
        cookieDomain={window.location.hostname}
        cookieSecure={window.location.protocol === 'https:'}
        refresh={async ({ refreshToken }) => {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            }
          )
          if (!res.ok) throw new Error('Refresh failed')
          const { accessToken, refreshToken: newRefresh } = await res.json()
          return { token: accessToken, refreshToken: newRefresh }
        }}
      >
        <Provider store={store}>
          <MenuProvider>
            <PlayerUIProvider>
              <App />
            </PlayerUIProvider>
          </MenuProvider>
        </Provider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

