import { AsyncAppThunk } from "../../app/store";
import { api } from "./chatAPI";
import { batchSize, chatsSlice, pageSize, selectChatMessages, selectInitState, selectLoadState } from "./chatsSlice";

export const loadMessages = (chatId: string, offsetId?: number, _pageSize = pageSize): AsyncAppThunk =>
    async (dispatch, getState) => {
        if (selectLoadState(chatId)(getState()) === "loading") {
            return;
        }
        dispatch(chatsSlice.actions.setLoadState({ chatId, state: "loading" }));
        try {
            const { data: messages, isFirst, isLast } = await api.getMessages(chatId, _pageSize, offsetId);

            dispatch(chatsSlice.actions.updateChat({
                chatId,
                chatData: {
                    messages,
                    isLastPage: isLast,
                    isFirstPage: isFirst,
                    loadState: "idle"
                }
            }));
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
        const messages = selectChatMessages(chatId)(getState());
        const offsetMessageId =
            messages.length >= pageSize - batchSize
                ? messages[pageSize - batchSize].id
                : messages.slice(-1)[0].id;
        dispatch(loadMessages(chatId, offsetMessageId));
    };

export const fetchNextMessages = (chatId: string): AsyncAppThunk =>
    async (dispatch, getState) => {
        const lowerBoundMessageId = selectChatMessages(chatId)(getState()).slice(-batchSize)[0].id;
        dispatch(loadMessages(chatId, lowerBoundMessageId + pageSize));
    };

export const fetchMoreMessages = (chatId: string): AsyncAppThunk =>
    async (dispatch, getState) => {

        if (selectLoadState(chatId)(getState()) === "loading") {
            return;
        }
        const messages = selectChatMessages(chatId)(getState());

        dispatch(chatsSlice.actions.setLoadState({ chatId, state: "loading" }));
        try {
            const { data: newMessages, isFirst, isLast } = await api.getMessages(chatId, pageSize, messages[0].id);

            dispatch(chatsSlice.actions.updateChat({
                chatId,
                chatData: {
                    messages: newMessages.concat(messages.slice(1)),
                    isLastPage: isLast,
                    isFirstPage: isFirst,
                    loadState: "idle"
                }
            }));
        } catch {
            dispatch(chatsSlice.actions.setLoadState({ chatId, state: "failed" }));
        }
    }