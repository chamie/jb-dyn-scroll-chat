import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import chatsReducer from '../features/chat/chatsSlice';

export const store = configureStore({
  reducer: {
    chat: chatsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AsyncAppThunk<ReturnType = void> = AppThunk<Promise<ReturnType>>;