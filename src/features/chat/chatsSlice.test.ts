import { RootState } from '../../app/store';
import reducer, { chatsSlice, ChatState, initialState as actualInitialState,
    selectChatMessages, selectChatTitle, selectInitState, selectIsFirstPage,
    selectIsLastPage, selectLoadState } from './chatsSlice';
import { ChatModel } from './models/chat';

const { actions } = chatsSlice;

let testInitialState: Readonly<ChatState> = { chatRooms: {} };

const chatId = 'chat1';

const chatData: Readonly<ChatModel> = {
    initState: 'in process',
    isFirstPage: false,
    isLastPage: true,
    loadState: 'loading',
    messages: [
        {
            date: 'some date',
            id: -900,
            name: 'no name',
            text: 'no text',
        }
    ],
    title: 'Chat No 1',
};

const rootState: RootState = {
    chat: {
        chatRooms: {
            [chatId]: {
                ...chatData,
            }
        }
    }
}

describe('Chats redux state tests', () => {
    describe('reducers', () => {
        it('should fill initial state', () => {
            // Act
            const newState = reducer(undefined, { type: undefined });

            // Assert
            expect(newState).toEqual(actualInitialState);
        });

        it('`updateChat` should set or update selected chat data', () => {
            // Act
            const newState = reducer(testInitialState, actions.updateChat({
                chatId,
                chatData,
            }));
            const updatedChatState = newState.chatRooms[chatId];

            // Assert
            expect(updatedChatState).toStrictEqual(chatData);
        });

        it("`setInitState` updates the chat's init state", () => {
            // Arrange
            const state: ChatState = {
                ...testInitialState,
                chatRooms: {
                    [chatId]: { ...chatData }
                }
            };

            // Act
            const newState = reducer(state, actions.setInitState({
                chatId,
                state: 'done',
            }));

            // Assert
            expect(newState.chatRooms[chatId].initState).toEqual('done');
        });

        it("`setLoadState` updates the chat's loadState", () => {
            // Arrange
            const state: ChatState = {
                ...testInitialState,
                chatRooms: {
                    [chatId]: { ...chatData }
                }
            };

            // Act
            const newState = reducer(state, actions.setLoadState({
                chatId,
                state: 'failed',
            }));

            // Assert
            expect(newState.chatRooms[chatId].loadState).toEqual('failed');
        });
    });
    describe('selectors', () => {
        it('`selectChatMessages` should return chat messages', ()=> {
            expect(selectChatMessages(chatId)(rootState)).toBe(chatData.messages);
        });
        it('`selectChatTitle` should return chat title', ()=> {
            expect(selectChatTitle(chatId)(rootState)).toBe(chatData.title);
        });
        it('`selectLoadState` should return chat loadState', ()=> {
            expect(selectLoadState(chatId)(rootState)).toBe(chatData.loadState);
        });
        it('`selectInitState` should return chat initState', ()=> {
            expect(selectInitState(chatId)(rootState)).toBe(chatData.initState);
        });
        it('`selectIsLastPage` should return if chat is scrolled to the last page', ()=> {
            expect(selectIsLastPage(chatId)(rootState)).toBe(chatData.isLastPage);
        });
        it('`selectIsFirstPage` should return if chat is scrolled to the first page', ()=> {
            expect(selectIsFirstPage(chatId)(rootState)).toBe(chatData.isFirstPage);
        });
    })
})