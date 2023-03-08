import { Message } from "../../../features/chat/models/message";
import { getRandomName, getRandomText, rnd } from "../../tools";
import { Results } from "../../types/results";

const fakeChatMessages: Record<string, Message[]> = {
    floodZone: [],
    archive: new Array(10000).fill(null).map((_, id) => {
        const date = (new Date().toISOString().match(/T([\d:]+)\./)!)[1];
        return ({
            chatId: 'archive',
            date,
            id,
            name: getRandomName(),
            text: getRandomText(),
        }) as Message;
    })
};

const delayedResolve = <T>(value: T): Promise<T> =>
    new Promise(resolve => setTimeout(() => resolve(value), rnd(1000)));

export const getMessages = (chatId: string, limit = 20, offsetId?: number): Promise<Results<Message>> => {
    const messages = fakeChatMessages[chatId] || [];
    const rangeEnd = Math.min((offsetId || Infinity) + 1, messages.length);
    const rangeStart = Math.max(rangeEnd - limit, 0);

    const data = messages.slice(rangeStart, rangeEnd);
    const isFirst = rangeStart === 0;
    const isLast = rangeEnd === messages.length;

    return delayedResolve({
        data,
        isFirst,
        isLast,
    });
}

export const addMessage = (chatId: string, text: string, name: string) => {
    const messages: Message[] = fakeChatMessages[chatId] || [];
    const message: Message = {
        name,
        text,
        date: (new Date().toISOString().match(/T([\d:]+)\./)!)[1],
        id: messages.length,
    };
    messages.push(message);
    fakeChatMessages[chatId] = messages;
}