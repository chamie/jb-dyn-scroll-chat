import { AsyncAppThunk } from "../../app/store";
import { fake } from "./chatAPI";
import { batchSize, chatsSlice, pageSize, selectChatMessages, selectInitState, selectLoadState } from "./chatsSlice";

export const loadMessages = (chatId: string, offsetId?: number): AsyncAppThunk =>
    async (dispatch, getState) => {
        if (selectLoadState(chatId)(getState()) === "loading") {
            return;
        }
        dispatch(chatsSlice.actions.setLoadState({ chatId, state: "loading" }));
        try {
            const messages = await fake.getMessages(chatId, pageSize, offsetId);

            dispatch(chatsSlice.actions.updateChat({ chatId, chatData: { messages } }));
            dispatch(chatsSlice.actions.setLoadState({ chatId, state: "idle" }));
        } catch {
            dispatch(chatsSlice.actions.setLoadState({ chatId, state: "failed" }));
        }
    };

export const init = (chatId: string): AsyncAppThunk =>
    async (dispatch, getState) => {
        if (selectInitState(chatId)(getState()) !== "initial") {
            return;
        }

        dispatch(chatsSlice.actions.setInitState({ chatId, state: "in process" }));

        await dispatch(loadMessages(chatId));

        dispatch(chatsSlice.actions.setInitState({ chatId, state: "done" }));
    };

export const fetchPreviousMessages = (chatId: string): AsyncAppThunk =>
    async (dispatch, getState) => {
        console.log(`Fetching prev messages`);
        const upperBoundMessageId = selectChatMessages(chatId)(getState())[0].id + batchSize;
        dispatch(loadMessages(chatId, upperBoundMessageId));
    };

export const fetchNextMessages = (chatId: string): AsyncAppThunk =>
    async (dispatch, getState) => {
        console.log(`Fetching next messages`);
        const lowerBoundMessageId = selectChatMessages(chatId)(getState()).slice(-1)[0].id - batchSize;
        dispatch(loadMessages(chatId, lowerBoundMessageId + pageSize));
    };