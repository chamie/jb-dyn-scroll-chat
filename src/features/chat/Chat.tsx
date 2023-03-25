import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { selectChatMessages, selectChatTitle, selectIsFirstPage, selectIsLastPage, selectLoadState } from "./chatsSlice"
import { init, fetchMoreMessages, fetchNextMessages, fetchPreviousMessages, loadMessages } from "./chatThunks";
import styles from "./Chat.module.css";
import { Message } from "./models/message";
import { DynamicList } from "../../common/components/dynamicList/DynamicList";
import { ArchiveList } from "../../common/components/dynamicList/ArchiveList";

const MessageComponent = (message: Message) => (
    <li className={styles.message} key={message.id}>
        <span>{message.id} </span>
        <span className={styles['message-name']}>{message.name}</span>
        <span className={styles['message-date']}>{message.date}</span>
        <span className={styles['message-text']}>{message.text}</span>
    </li>
)

export const Chat = () => {
    const shouldLoadMessages = useRef<boolean>(true);
    const { chatId = "floodZone" } = useParams();
    const isArchive = chatId.startsWith("archi");

    const dispatch = useAppDispatch();

    let interval = useRef(0);

    useEffect(() => {
        interval.current = window.setInterval(() => {
            if (shouldLoadMessages.current) {
                dispatch(loadMessages(chatId));
                if(isArchive){
                    shouldLoadMessages.current = false;
                }
            }
        }, 1000);

        return () => {
            clearInterval(interval.current);
        }
    }, [chatId, dispatch, isArchive]);

    useEffect(() => {
        dispatch(init(chatId));
    }, [dispatch, chatId]);

    const messages = useAppSelector(selectChatMessages(chatId));

    const isLastPage = useAppSelector(selectIsLastPage(chatId));
    const loadNextRecords = isLastPage
        ? undefined
        : () => dispatch(fetchNextMessages(chatId));

    const isFirstPage = useAppSelector(selectIsFirstPage(chatId));

    const loadPreviousRecords = isFirstPage
        ? undefined
        : () => dispatch(fetchPreviousMessages(chatId));

    const addPreviousRecords = isFirstPage
        ? undefined
        : () => dispatch(fetchMoreMessages(chatId));

    const title = useAppSelector(selectChatTitle(chatId));

    const isLoadFailed = useAppSelector(selectLoadState(chatId)) === "failed";

    return <div>
        <h4>{title}</h4>
        {
            isLoadFailed
                ? <h1 className={styles.error}>Load failed, try reloading the page</h1>
                : null
        }
        {isArchive
            ? <ArchiveList
                items={messages}
                ElementComponent={MessageComponent}
                loadPreviousRecords={addPreviousRecords}
            />
            : <DynamicList
                items={messages}
                ElementComponent={MessageComponent}
                loadPreviousRecords={loadPreviousRecords}
                loadNextRecords={loadNextRecords}
                onHitBottom={isBottom => {
                    shouldLoadMessages.current = isBottom;
                }}
                listId={chatId}
            />
        }
    </div>;
}