import { Message } from "../../../features/chat/models/message";
import { rnd } from "../../tools";
import { Results } from "../../types/results";

const fakeChatMessages: Record<string, Message[]> = {
    floodZone: [],
};

const delayedResolve = <T>(value: T): Promise<T> =>
    new Promise(resolve => setTimeout(() => resolve(value), rnd(1000)));

export const getMessages = (chatId: string, limit = 20, offsetId?: number): Promise<Results<Message>> => {
    const messages = fakeChatMessages[chatId];
    const rangeEnd = Math.min(offsetId || Infinity, messages.length);
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
    const message: Message = {
        name,
        text,
        date: (new Date().toISOString().match(/T([\d:]+)\./)!)[1],
        id: fakeChatMessages[chatId].length
    };
    fakeChatMessages[chatId].push(message);
}