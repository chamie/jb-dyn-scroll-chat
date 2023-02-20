import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { batchSize, pageSize, selectChatMessages } from "./chatsSlice"
import { fetchPreviousMessages, fetchNextMessages, init, loadMessages } from "./chatThunks";
import styles from "./Chat.module.css";
import { Message } from "./models/message";
import { DynamicList } from "../../common/components/dynamicList/DynamicList";

const MessageComponent = (message: Message) => (
    <li className={styles.message} key={message.id}>
        <span className={styles['message-name']}>{message.name}</span>
        <span className={styles['message-date']}>{message.date}</span>
        <span className={styles['message-text']}>{message.text}</span>
    </li>
)

export const Chat = () => {
    let { chatId = "floodZone" } = useParams();

    const [isAtBottom, setIsBottom] = useState(true);

    const dispatch = useAppDispatch();

    let interval = useRef(0);

    useEffect(() => {
        interval.current = window.setInterval(() => {
            if (isAtBottom) {
                dispatch(loadMessages(chatId));
            }
        }, 1000);

        return () => {
            clearInterval(interval.current);
        }
    }, [chatId, dispatch, isAtBottom]);

    useEffect(() => {
        dispatch(init(chatId));
    }, [dispatch, chatId]);

    const messages = useAppSelector(selectChatMessages(chatId));

    //console.log({ messages });

    const isLast = messages.length < pageSize;

    const isFirst = !messages[0]?.id;

    return <div>
        <DynamicList
            elements={messages}
            ElementComponent={MessageComponent}
            onUpperBoundReached={() => dispatch(fetchPreviousMessages(chatId))}
            onLowerBoundReached={() => dispatch(fetchNextMessages(chatId))}
            onReachedBottom={_isBottom => {
                clearInterval(interval.current);
                setIsBottom(_isBottom);
            }}
            isLastPage={isLast}
            isFirstPage={isFirst}
            batchSize={batchSize}
        />
    </div>;
}