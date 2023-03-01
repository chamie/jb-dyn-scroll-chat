import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useIsInViewport } from "../../hooks/isInViewPort";
import styles from './DynamicList.module.css';

export type Props<T> = {
    items: T[],
    ElementComponent: React.ComponentType<T>,
    loadPreviousRecords?: () => void,
    loadNextRecords?: () => void,
    onHitBottom: (isBottom: boolean) => void,
    listId?: string | number,
}

type PositioningMode = "keep in place" | "stick to bottom";

const DynamicListComponent = <T extends { id: string | number },>(props: Props<T>) => {
    const { items, ElementComponent, loadPreviousRecords, loadNextRecords, onHitBottom, listId = -1 } = props;

    /** Refers to the top edge separator. When it comes into view, we load previous messages */
    const loadPrevTriggerRef = useRef<HTMLDivElement>(null);
    /** Refers to the bottom edge separator. When it comes into view, we load next messages */
    const loadNextTriggerRef = useRef<HTMLDivElement>(null);

    /** Expected to be used before being set (i.e. using value from the previous render) */
    const firstItemElementRef = useRef<HTMLDivElement>(null);
    /** Expected to be used before being set (i.e. using value from the previous render) */
    const lastItemElementRef = useRef<HTMLDivElement>(null);

    const firstItemIdRef = useRef<string | number>(-1);
    const lastItemIdRef = useRef<string | number>(-1);

    /** An item that was in the list during previous render, we use it as a reference point of list position */
    const matchingNewItemElementRef = useRef<HTMLDivElement>(null);

    const matchingItemId = items.find(
        item =>
            item.id === firstItemIdRef.current
            || item.id === lastItemIdRef.current
    )?.id;

    const matchingOldItemOffset = (
        matchingItemId === firstItemIdRef.current
            ? firstItemElementRef
            : lastItemElementRef
    ).current?.offsetTop || 0;

    if (items.length) {
        firstItemIdRef.current = items[0].id;
        lastItemIdRef.current = items.slice(-1)[0].id;
    }

    const containerRef = useRef<HTMLDivElement>(null);

    /** Distance from the top of the matching element
     * to the top of the container's visible part */
    let scrollOffset = 0;
    if (containerRef.current) {
        const containerScrollTop = containerRef.current.scrollTop || 0;
        scrollOffset = matchingOldItemOffset - containerScrollTop;
    }

    const positioningModeRef = useRef<PositioningMode>("stick to bottom");

    const prevListId = useRef(listId);

    if (prevListId.current !== listId) {
        positioningModeRef.current = "stick to bottom";
        onHitBottom(true);
    }

    prevListId.current = listId;

    useLayoutEffect(
        /** Apply scroll position */
        () => {
            //window.requestAnimationFrame(() => {
            const containerElement = containerRef.current;
            if (!containerElement) {
                return;
            }

            if (positioningModeRef.current === "keep in place") {
                const newItemOffset = matchingNewItemElementRef.current?.offsetTop || 0;
                containerElement.scrollTop = newItemOffset - scrollOffset;
            }
            if (positioningModeRef.current === "stick to bottom") {
                containerElement.scrollTop = containerElement.scrollHeight;
            }
            //});
        });

    const wasTopEdgeVisible = useRef(true);
    useIsInViewport(loadPrevTriggerRef, (isTopEdgeVisible) => {
        if (isTopEdgeVisible !== wasTopEdgeVisible.current) {
            if (isTopEdgeVisible && loadPreviousRecords) {
                loadPreviousRecords();
            }
            wasTopEdgeVisible.current = isTopEdgeVisible;
        }
    });

    const wasBottomEdgeVisible = useRef(true);
    useIsInViewport(loadNextTriggerRef, (isBottomEdgeVisible) => {
        if (isBottomEdgeVisible !== wasBottomEdgeVisible.current) {
            if (isBottomEdgeVisible && loadNextRecords) {
                loadNextRecords();
            }
            wasBottomEdgeVisible.current = isBottomEdgeVisible;
        }
    });

    const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        const scrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
        const hasReachedTheVeryBottom = scrolledToBottom && !loadNextRecords;
        const wasAtBottom = positioningModeRef.current === "stick to bottom";
        positioningModeRef.current = hasReachedTheVeryBottom ? "stick to bottom" : "keep in place";
        if (wasAtBottom !== hasReachedTheVeryBottom) {
            onHitBottom(hasReachedTheVeryBottom);
        }
    }

    return (
        <div ref={containerRef} className={styles.container} onScroll={onScroll} data-testid="list-container">
            {
                loadPreviousRecords &&
                <div data-testid="upper-loader" ref={loadPrevTriggerRef} className={styles['edgeline-loader']}>Loading more…</div>
            }

            {items.map((item, idx) => {
                let ref: React.RefObject<HTMLDivElement> | undefined = undefined;
                if (item.id === matchingItemId) {
                    ref = matchingNewItemElementRef;
                }
                if (idx === 0) {
                    ref = firstItemElementRef;
                }
                if (idx === items.length - 1) {
                    ref = lastItemElementRef;
                }

                return <div data-testid="item" ref={ref} key={item.id}> <ElementComponent {...item} key={item.id} /></div>;
            })}

            {
                loadNextRecords &&
                <div data-testid="lower-loader" ref={loadNextTriggerRef} className={styles['edgeline-loader']}>Loading more…</div>
            }
        </div>)
};

export const DynamicList = React.memo(DynamicListComponent) as typeof DynamicListComponent;