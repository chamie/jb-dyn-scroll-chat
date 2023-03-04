import { RootState } from '../../app/store';
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitState } from '../../common/types/initState';
import { LoadState } from '../../common/types/loadState';
import { ChatModel } from './models/chat';

export const pageSize = 100;
export const batchSize = 5;

export type ChatState = {
    chatRooms: Record<string, ChatModel>,
}

export const initialState: ChatState = {
    chatRooms: {
        floodZone: {
            messages: [],
            title: "Flood Zone",
            loadState: "idle",
            initState: "initial",
            isLastPage: true,
            isFirstPage: true,
        },
        anotherOne: {
            messages: [],
            title: "Another One",
            loadState: "idle",
            initState: "initial",
            isLastPage: true,
            isFirstPage: true,
        },
        archive: {
            messages: [],
            title: "Archive",
            loadState: "idle",
            initState: "initial",
            isLastPage: true,
            isFirstPage: true,
        }
    },
};

export const chatsSlice = createSlice({
    name: "chats",
    initialState,
    reducers: {
        updateChat: (state, action: PayloadAction<{ chatId: string, chatData: Partial<ChatModel> }>) => {
            const { chatId, chatData } = action.payload;
            const chat = state.chatRooms[chatId];
            state.chatRooms[chatId] = { ...chat, ...chatData };
        },
        setInitState: (state, action: PayloadAction<{ state: InitState, chatId: string }>) => {
            state.chatRooms[action.payload.chatId].initState = action.payload.state;
        },
        setLoadState: (state, action: PayloadAction<{ state: LoadState, chatId: string }>) => {
            state.chatRooms[action.payload.chatId].loadState = action.payload.state;
        }
    },
});

export const { setInitState } = chatsSlice.actions;

export default chatsSlice.reducer;

export const selectChatMessages = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].messages;

export const selectChatTitle = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].title;

export const selectLoadState = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].loadState;

export const selectInitState = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].initState;

export const selectIsLastPage = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].isLastPage;

export const selectIsFirstPage = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].isFirstPage;