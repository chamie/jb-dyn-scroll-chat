import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { selectChatMessages, selectChatTitle, selectIsFirstPage, selectIsLastPage } from "./chatsSlice"
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
    const isAtBottomRef = useRef<boolean>(true);
    const { chatId = "floodZone" } = useParams();
    const isArchive = chatId.startsWith("archi");

    const dispatch = useAppDispatch();

    let interval = useRef(0);

    useEffect(() => {
        interval.current = window.setInterval(() => {
            if (isAtBottomRef.current) {
                dispatch(loadMessages(chatId));
            }
        }, 1000);

        return () => {
            clearInterval(interval.current);
        }
    }, [chatId, dispatch]);

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

    return <div>
        <h4>{title}</h4>
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
                    isAtBottomRef.current = isBottom;
                }}
                listId={chatId}
            />
        }
    </div>;
}