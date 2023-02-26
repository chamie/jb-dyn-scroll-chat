export type Message = {
    id: number,
    name: string,
    text: string,
    date: string,
}

export type MessageCreateDto = {
    name: string,
    text: string,
    chatId: string,
    date: string,
}