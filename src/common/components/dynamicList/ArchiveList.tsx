import React, { useLayoutEffect, useRef, useState } from "react";
import { deepEqual as _deepEqual } from "../../tools";
import styles from './DynamicList.module.css';
import memoizeOne from "memoize-one";

export type Props<T> = {
    items: T[],
    ElementComponent: React.ComponentType<T>,
    loadPreviousRecords?: () => void,
    renderBufferSize?: number,
}

type ItemSizingInfo = {
    id: string | number,
    height: number,
}

type RenderInfo = {
    items: (string | number)[],
    paddingTop: number,
    paddingBottom: number,
}

const deepEqual = memoizeOne(_deepEqual);

/**
 * Calculates which items should be rendered in the scroll container given the sizes and scroll position
 * @param itemInfos size and id for each known item, ordered from top to bottom
 * @param offsetHeight scrolling container's height
 * @param scrollHeight scrolling container's scrollHeight
 * @param scrollTop scrolling container's scrollTop
 * @param bufferSize size of the area that is not visible but should be rendered
 * @returns ids of the items to be rendered given these sizes and the scroll position, and padding sizes that would substitute the non-rendered items.
 */
const getVisibleItems =
    (itemInfos: ItemSizingInfo[], offsetHeight: number, scrollHeight: number, scrollTop: number, bufferSize: number): RenderInfo => {
        // Distamce from the top of container's visible part to its content bottom:
        const upperBound = scrollHeight - scrollTop + bufferSize;
        // Distance from the bottom of container's visible part to its content bottom:
        const lowerBound = scrollHeight - scrollTop - offsetHeight - bufferSize;

        let itemBottom = 0;
        let paddingTop = 0;
        let paddingBottom = 0;
        const items: (string | number)[] = [];

        itemInfos.reverse().forEach(item => {
            const itemTop = itemBottom + item.height;
            if (itemBottom <= upperBound && itemTop >= lowerBound) {
                items.push(item.id)
            } else if (itemBottom < lowerBound) {
                paddingBottom += item.height;
            } else if (itemTop > upperBound) {
                paddingTop += item.height;
            }
            itemBottom += item.height;
        });

        return { items, paddingBottom, paddingTop };
    };

const ArchiveListComponent = <T extends { id: string | number },>(props: Props<T>) => {
    const { items, ElementComponent, loadPreviousRecords, renderBufferSize = 3000 } = props;

    const previousItems = useRef<T[]>([]);
    const hasListChanged = !deepEqual(previousItems.current, items);

    /** Stores rendered elements of the items added to DOM during the prev render */
    const renderedItemElementsRef = useRef(new Map<string | number, HTMLDivElement>());

    /** Stores the heights of all known items, populated on their first render */
    const itemHeightsListRef = useRef([] as [string | number, number][]);
    const heights = new Map(itemHeightsListRef.current);

    /**
     * Id of any item present in both current and the previous render.
     * It will be used as a reference point to adjust the scroll position
     * and avoid list jumping on loading additional items.
     */
    const matchingItemId = items.find(
        item => renderedItemElementsRef.current.has(item.id)
    )?.id;

    const matchingItemPreviousOffset = (
        matchingItemId === undefined
            ? undefined
            : renderedItemElementsRef.current.get(matchingItemId)
    )?.offsetTop || 0;

    renderedItemElementsRef.current.clear();

    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Distance from the top of the matching item
     * to the top of the scroll container's visible part
     * just before this render, should keep it same after.
     */
    let scrollOffset = 0;
    if (containerRef.current) {
        const containerScrollTop = containerRef.current.scrollTop || 0;
        scrollOffset = matchingItemPreviousOffset - containerScrollTop;
    }

    const [renderInfo, setRenderInfo] = useState<RenderInfo>({ items: items.map(x => x.id), paddingBottom: 0, paddingTop: 0 });

    const itemsToShow = renderInfo.items.length ? new Set(renderInfo.items) : new Set(items.map(x => x.id));
    const { paddingTop, paddingBottom } = renderInfo;

    /** Set to true on manual scroll manipulations */
    const skipOnScroll = useRef(false);

    useLayoutEffect(
        /** Apply scroll position */
        () => {
            //window.requestAnimationFrame(() => {
            if (!hasListChanged) {
                return;
            }

            const containerElement = containerRef.current;
            if (!containerElement) { // should never happen, tbh.
                console.error("OH RLY?!!");
                return;
            }

            // If list is populated for the first time
            if (!previousItems.current.length && items.length) {
                containerElement.scrollTop = containerElement.scrollHeight;
            }

            previousItems.current = items;

            if (matchingItemId) {
                const matchingNewItemElement = renderedItemElementsRef.current.get(matchingItemId);
                const newItemOffset = matchingNewItemElement?.offsetTop || 0;
                skipOnScroll.current = true;
                containerElement.scrollTop = newItemOffset - scrollOffset;
            }
            //});
        });

    const wasLoadPrevCalled = useRef(false);

    // reset to false on list change
    wasLoadPrevCalled.current = !hasListChanged && wasLoadPrevCalled.current;

    const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        if (skipOnScroll.current) {
            skipOnScroll.current = false;
            return;
        }

        const { scrollTop, scrollHeight, offsetHeight } = event.currentTarget;

        if (scrollTop <= renderBufferSize && loadPreviousRecords && !wasLoadPrevCalled.current) {
            wasLoadPrevCalled.current = true;
            loadPreviousRecords();
        }

        let knownHeightsList = itemHeightsListRef.current;
        const knownHeightsMap = new Map(knownHeightsList);

        const newlyRenderedItemsHeights: [string | number, number][] = [];
        for (const [id, element] of renderedItemElementsRef.current.entries()) {
            if (knownHeightsMap.has(id)) {
                break;
            }
            newlyRenderedItemsHeights.push([id, element.offsetHeight]);
        };

        knownHeightsList = newlyRenderedItemsHeights.concat(knownHeightsList);
        itemHeightsListRef.current = knownHeightsList;

        const itemHeights: ItemSizingInfo[] = knownHeightsList.map(([id, height]) => ({ id, height }));
        const updatedRenderInfo = getVisibleItems(itemHeights, offsetHeight, scrollHeight, scrollTop, renderBufferSize);
        if (!deepEqual(updatedRenderInfo, renderInfo)) {
            setRenderInfo(updatedRenderInfo);
        }
    }

    return (
        <div ref={containerRef} className={styles.container} onScroll={onScroll} data-testid="list-container">
            {
                loadPreviousRecords &&
                <div data-testid="upper-loader" className={styles['edgeline-loader']}>Loading more…</div>
            }

            <div className={styles.items} style={{ paddingTop, paddingBottom }}>
                {items.map((item, idx) =>
                    itemsToShow.has(item.id) || !heights.has(item.id)
                        ? <div
                            className={styles.item}
                            data-divider={!(idx % 20) ? ">============================================<" : undefined}
                            data-testid="item"
                            ref={(element: HTMLDivElement) => renderedItemElementsRef.current.set(item.id, element)}
                            key={item.id}>
                            <ElementComponent {...item} key={item.id} />
                        </div>
                        : null
                )}
            </div>
        </div>)
};

export const ArchiveList = React.memo(ArchiveListComponent) as typeof ArchiveListComponent;