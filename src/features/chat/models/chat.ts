import { InitState } from "../../../common/types/initState";
import { LoadState } from "../../../common/types/loadState";
import { Message } from "./message";

type ChatModelInternal = {
    title: string,
    messages: Message[],
    loadState: LoadState,
    initState: InitState,
    isLastPage: boolean,
    isFirstPage: boolean,
}

export type ChatModel = Readonly<ChatModelInternal>;