import { configureStore } from '@reduxjs/toolkit';
import { candidatesApi } from './api/candidatesApi';

export const store = configureStore({
  reducer: {
    [candidatesApi.reducerPath]: candidatesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(candidatesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
