// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';

import playerReducer from './playerSlice';
import { api } from '../utils/api';


export const store = configureStore({
  reducer: {
    player: playerReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

