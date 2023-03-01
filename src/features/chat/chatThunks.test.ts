import { loadMessages } from './chatThunks';
import * as chatsSlice from './chatsSlice';
import * as API from './chatAPI';
import { expect, jest } from '@jest/globals'
import { Results } from '../../common/types/results';
import { Message } from './models/message';
import { RootState } from '../../app/store';
import { ChatModel } from './models/chat';

jest.mock('./chatAPI');

jest.mock('./chatsSlice');

const chatId = 'chat1';

describe('chats thunks', () => {
    describe('loadMessages', () => {
        it('should load messages from API for a given chat using given offsetId and put into its state', async () => {
            // Arrange
            const selectLoadStateMock = jest.spyOn(chatsSlice, 'selectLoadState').mockImplementation(() => () => 'idle');

            const requestResult: Results<Message> = {
                isFirst: false,
                isLast: false,
                data: [
                    {
                        date: 'sumdate',
                        id: 9000,
                        name: 'surname',
                        text: 'no text',
                    }
                ]
            };

            const resultState: Partial<ChatModel> = {
                isFirstPage: false,
                isLastPage: false,
                loadState: "idle",
                messages: requestResult.data,
            };

            const mockApi = API.api as jest.Mocked<typeof API.api>;
            mockApi.getMessages.mockImplementation(() => {
                return Promise.resolve(requestResult);
            });

            const state: RootState = {
                chat: {
                    chatRooms: {}
                }
            };
            const dispatch = jest.fn();
            const getState = jest.fn<RootState, any>().mockReturnValue(state);

            // Act
            await loadMessages(chatId, -100)(dispatch, getState, {});

            // Assert
            const mockActions = chatsSlice.chatsSlice.actions as jest.Mocked<typeof chatsSlice.chatsSlice.actions>;
            const setLoadStateMock = mockActions.setLoadState;
            const updateChatMock = mockActions.updateChat;

            expect(selectLoadStateMock).toBeCalledWith(chatId);
            expect(dispatch).toBeCalledTimes(2);
            expect(setLoadStateMock).toBeCalledWith({ chatId, state: "loading" });
            expect(updateChatMock).toBeCalledWith({ chatId, chatData: resultState });
        })
    })
})