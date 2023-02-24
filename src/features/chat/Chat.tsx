import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { selectChatMessages, selectIsFirstPage, selectIsLastPage } from "./chatsSlice"
import { fetchPreviousMessages, fetchNextMessages, init, loadMessages } from "./chatThunks";
import styles from "./Chat.module.css";
import { Message } from "./models/message";
import { DynamicList } from "../../common/components/dynamicList/DynamicList";

const MessageComponent = (message: Message) => (
    <li className={styles.message} key={message.id}>
        <span>{message.id} </span>
        <span className={styles['message-name']}>{message.name}</span>
        <span className={styles['message-date']}>{message.date}</span>
        <span className={styles['message-text']}>{message.text}</span>
    </li>
)

export const Chat = () => {
    let { chatId = "floodZone" } = useParams();

    const isAtBottomRef = useRef<boolean>(true);

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

    return <div>
        <DynamicList
            items={messages}
            ElementComponent={MessageComponent}
            loadPreviousRecords={loadPreviousRecords}
            loadNextRecords={loadNextRecords}
            onHitBottom={isBottom => {
                isAtBottomRef.current = isBottom;
            }}
        />
    </div>;
}