import React, { useLayoutEffect, useRef } from "react";
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

    /** Keeps tabs on all the items already rendered to the DOM */
    const knownItemElementsRef = useRef(new Map<string | number, HTMLDivElement>());

    /** Id of an item present in both current and the previous render */
    const matchingItemId = items.find(
        item => knownItemElementsRef.current.has(item.id)
    )?.id;

    const matchingItemPreviousOffset = (
        matchingItemId === undefined
            ? undefined
            : knownItemElementsRef.current.get(matchingItemId)
    )?.offsetTop || 0;

    knownItemElementsRef.current.clear();

    const containerRef = useRef<HTMLDivElement>(null);

    /** Distance from the top of the matching item
     * to the top of the container's visible part */
    let scrollOffset = 0;
    if (containerRef.current) {
        const containerScrollTop = containerRef.current.scrollTop || 0;
        scrollOffset = matchingItemPreviousOffset - containerScrollTop;
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

            if (positioningModeRef.current === "keep in place" && matchingItemId) {
                const matchingNewItemElement = knownItemElementsRef.current.get(matchingItemId);
                const newItemOffset = matchingNewItemElement?.offsetTop || 0;
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

    const saveItemRef = (itemId: string | number) => (element: HTMLDivElement) => {
        knownItemElementsRef.current.set(itemId, element);
    }

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

            {items.map(item =>
                <div data-testid="item" ref={saveItemRef(item.id)} key={item.id}> <ElementComponent {...item} key={item.id} /></div>
            )}

            {
                loadNextRecords &&
                <div data-testid="lower-loader" ref={loadNextTriggerRef} className={styles['edgeline-loader']}>Loading more…</div>
            }
        </div>)
};

export const DynamicList = React.memo(DynamicListComponent) as typeof DynamicListComponent;