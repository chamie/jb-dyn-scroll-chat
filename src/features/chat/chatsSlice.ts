import { RootState } from '../../app/store';
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitState } from '../../common/types/initState';
import { LoadState } from '../../common/types/loadState';
import { Message } from './models/message';

export const pageSize = 20;
export const batchSize = 10;

type Chat = {
    title: string,
    messages: Message[],
    loadState: LoadState,
    initState: InitState,
}

export type ChatState = {
    chatRooms: Record<string, Chat>,
}

const initialState: ChatState = {
    chatRooms: {
        floodZone: {
            messages: [],
            title: "Flood Zone",
            loadState: "idle",
            initState: "initial",
        }
    },
};

export const chatsSlice = createSlice({
    name: "chats",
    initialState,
    reducers: {
        updateChat: (state, action: PayloadAction<{ chatId: string, chatData: Partial<Chat> }>) => {
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

export const selectChatData = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId];

export const selectLoadState = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].loadState;

export const selectInitState = (chatId: string) => (state: RootState) => state.chat.chatRooms[chatId].initState;