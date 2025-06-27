import React from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './styles/index.css';
import './styles/fonts.css'
import { MenuProvider } from './context/MenuContext';
import { PlayerUIProvider } from './context/PlayerUIContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
     <MenuProvider>
      <PlayerUIProvider>
        <App />
      </PlayerUIProvider>
     </MenuProvider>
    </Provider>
  </React.StrictMode>
);
