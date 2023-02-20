import { useEffect, useRef, useState } from "react";
import { useIsInViewport } from "../../hooks/isInViewPort";
import styles from './DynamicList.module.css';

export type Props<T> = {
    elements: T[],
    ElementComponent: React.ComponentType<T>,
    onUpperBoundReached: () => void,
    onLowerBoundReached: () => void,
    onReachedBottom: (isBottom: boolean) => void,
    isLastPage: boolean,
    isFirstPage: boolean,
    batchSize: number,
}

export const DynamicList = <T,>(props: Props<T>) => {
    const { elements, ElementComponent, onUpperBoundReached, onLowerBoundReached, isFirstPage, isLastPage, onReachedBottom, batchSize } = props;

    /** Refers to the top edge separator, when it comes into view, we load previous messages */
    const topEdgeRef = useRef<HTMLDivElement>(null);
    /** Refers to the bottom edge separator, when it comes into view, we load next messages */
    const bottomEdgeRef = useRef<HTMLDivElement>(null);
    /** Refers to the element that previously was at top, so we could scroll to it to keep it on top of the scroll container */
    const previousFirstElementRef = useRef<HTMLDivElement>(null);
    /** Refers to the element that previously was at bottom, so we could scroll to it to keep it on at of the scroll container */
    const previousLastElementRef = useRef<HTMLDivElement>(null);
    const bottomAnchorRef = useRef<HTMLDivElement>(null);

    const [wasTopEdgeVisible, setWasTopEdgeVisible] = useState(false);
    const [wasBottomEdgeVisible, setWasBottomEdgeVisible] = useState(false);

    const [isAtBottom, setIsAtBottom] = useState(true);

    useEffect(() => {
        if (isAtBottom) {
            bottomAnchorRef.current?.scrollIntoView();
        }
    });

    useEffect(() => {
        if (!isAtBottom) {
            if (wasTopEdgeVisible) {
                previousFirstElementRef.current?.scrollIntoView();
            }
            if (wasBottomEdgeVisible) {
                previousLastElementRef.current?.scrollIntoView(false);
            }
        }
    }, [isAtBottom, wasBottomEdgeVisible, wasTopEdgeVisible]);

    useIsInViewport(topEdgeRef, (isVisible) => {
        //console.log(`Upper`, { isVisible });
        if (isVisible && !wasTopEdgeVisible && !isFirstPage) {
            onUpperBoundReached();
        }
        if (isVisible !== wasTopEdgeVisible) {
            setWasTopEdgeVisible(isVisible);
        }
    });

    useIsInViewport(bottomEdgeRef, (isVisible) => {
        //console.log(`Lower`, { isVisible });
        if (isVisible && !wasBottomEdgeVisible && !isLastPage) {
            onLowerBoundReached();
        }
        if (isVisible !== wasBottomEdgeVisible) {
            setWasBottomEdgeVisible(isVisible);
        }
    });

    const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        const scrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
        const hasReachedTheVeryBottom = scrolledToBottom && isLastPage;
        if (hasReachedTheVeryBottom !== isAtBottom) {
            setIsAtBottom(hasReachedTheVeryBottom);
            onReachedBottom(scrolledToBottom && isLastPage);
        }
    }

    return (
        <div className={styles.container} onScroll={onScroll}>
            {
                !isFirstPage &&
                <div ref={topEdgeRef} className="bound">Loading more…</div>
            }

            {elements.map((element, idx) => {
                const ref = idx === batchSize
                    ? previousFirstElementRef
                    : idx === elements.length - batchSize
                        ? previousLastElementRef
                        : null;
                return <div ref={ref} key={idx}> <ElementComponent {...element} key={idx} /></div>;
            })}

            {
                !isLastPage &&
                <div ref={bottomEdgeRef} className="bound">Loading more…</div>
            }
            <div style={{ float: "left", clear: "both" }}
                ref={bottomAnchorRef}>
            </div>
        </div>)
}