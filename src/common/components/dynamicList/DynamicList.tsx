import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIsInViewport } from "../../hooks/isInViewPort";
import styles from './DynamicList.module.css';

export type Props<T> = {
    items: T[],
    ElementComponent: React.ComponentType<T>,
    loadPreviousRecords?: () => void,
    loadNextRecords?: () => void,
    onHitBottom: (isBottom: boolean) => void,
}

type PositioningMode = "keep in place" | "stick to bottom" | "do nothing";

const DynamicListComponent = <T extends { id: string | number },>(props: Props<T>) => {
    const { items, ElementComponent, loadPreviousRecords, loadNextRecords, onHitBottom } = props;

    /** Refers to the top edge separator. When it comes into view, we load previous messages */
    const loadPrevTriggerRef = useRef<HTMLDivElement>(null);
    /** Refers to the bottom edge separator. When it comes into view, we load next messages */
    const loadNextTriggerRef = useRef<HTMLDivElement>(null);

    /** Expected to be used before being set (i.e. using value from the previous render) */
    const firstItemElementRef = useRef<HTMLDivElement>(null);
    /** Expected to be used before being set (i.e. using value from the previous render) */
    const lastItemElementRef = useRef<HTMLDivElement>(null);
    const matchingNewItemElementRef = useRef<HTMLDivElement>(null);
    const previousFirstItemIdRef = useRef<string | number>(-1);
    const previousLastItemIdRef = useRef<string | number>(-1);

    let matchingItemId: string | number = -1;
    let matchingOldItemOffset = -1;

    items.some(item => {
        if (item.id === previousLastItemIdRef.current) {
            matchingItemId = item.id;
            matchingOldItemOffset = lastItemElementRef.current?.offsetTop || 0;
            return true;
        }
        if (item.id === previousFirstItemIdRef.current) {
            matchingItemId = item.id;
            matchingOldItemOffset = firstItemElementRef.current?.offsetTop || 0;
            return true;
        }
        return false;
    });

    if (items.length) {
        previousFirstItemIdRef.current = items[0].id;
        previousLastItemIdRef.current = items.slice(-1)[0].id;
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

    useLayoutEffect(() => {
        //window.requestAnimationFrame(() => {
        if (positioningModeRef.current === "keep in place") {
            if (containerRef.current) {
                const newItemOffset = matchingNewItemElementRef.current?.offsetTop || 0;
                containerRef.current.scrollTop = newItemOffset - scrollOffset;
            }
            positioningModeRef.current = "do nothing";
        }
        //});
    });

    useEffect(() => {
        if (containerRef.current && positioningModeRef.current === "stick to bottom") {
            // Scroll to bottom
            const listElement = containerRef.current;
            listElement.scrollTop = listElement.scrollHeight;
        }
    });

    const wasTopEdgeVisible = useRef(true);
    useIsInViewport(loadPrevTriggerRef, (isTopEdgeVisible) => {
        if (isTopEdgeVisible !== wasTopEdgeVisible.current) {
            if (isTopEdgeVisible && loadPreviousRecords) {
                positioningModeRef.current = "keep in place";
                loadPreviousRecords();
            }
            wasTopEdgeVisible.current = isTopEdgeVisible;
        }
    });

    const wasBottomEdgeVisible = useRef(true);
    useIsInViewport(loadNextTriggerRef, (isBottomEdgeVisible) => {
        if (isBottomEdgeVisible !== wasBottomEdgeVisible.current) {
            if (isBottomEdgeVisible && loadNextRecords) {
                positioningModeRef.current = "keep in place";
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
        if (wasAtBottom !== hasReachedTheVeryBottom) {
            positioningModeRef.current = hasReachedTheVeryBottom ? "stick to bottom" : "do nothing";
            onHitBottom(hasReachedTheVeryBottom);
        }
    }

    return (
        <div ref={containerRef} className={styles.container} onScroll={onScroll}>
            {
                loadPreviousRecords &&
                <div ref={loadPrevTriggerRef} className={styles['edgeline-loader']}>Loading more…</div>
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
                // const ref = item.id === matchingItemId
                //     ? matchingNewItemElementRef
                //     : idx === 0
                //         ? previousFirstItemElementRef
                //         : idx === items.length - 1
                //             ? previousLastItemElementRef
                //             : undefined;
                return <div ref={ref} key={item.id}> <ElementComponent {...item} key={item.id} /></div>;
            })}

            {
                loadNextRecords &&
                <div ref={loadNextTriggerRef} className={styles['edgeline-loader']}>Loading more…</div>
            }
        </div>)
};

export const DynamicList = React.memo(DynamicListComponent) as typeof DynamicListComponent;