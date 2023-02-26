import { Message, MessageCreateDto } from "../../../features/chat/models/message";
import { Results } from "../../types/results";

export const getMessages = async (chatId: string, limit = 20, offsetId?: number): Promise<Results<Message>> => {
    const response = await fetch(`chats/${chatId}/messages?${offsetId === undefined ? "" : `id_lte=${offsetId}&`}_limit=${limit}&_sort=id&_order=desc`);
    const results = await response.json() as Results<Message>;

    return results;
};
export const addMessage = (chatId: string, text: string, name: string) => {
    const date = (new Date().toISOString().match(/T([\d:]+)\./)!)[1];
    const message: MessageCreateDto = { name, text, chatId, date };
    fetch(`messages`, {
        method: "POST",
        body: JSON.stringify(message),
        headers: {
            "content-type": "application/json",
        },
    })
}