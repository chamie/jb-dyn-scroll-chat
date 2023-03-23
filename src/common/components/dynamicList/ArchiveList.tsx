import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { deepEqual as _deepEqual } from "../../tools";
import styles from './DynamicList.module.css';
import memoizeOne from "memoize-one";
import { ItemSizingInfo } from "./itemSizing";

export type Props<T> = {
    items: T[],
    ElementComponent: React.ComponentType<T>,
    loadPreviousRecords?: () => void,
    renderBufferSize?: number,
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
    (itemInfos: readonly ItemSizingInfo[], offsetHeight: number, scrollHeight: number, scrollTop: number, bufferSize: number, itemOffsetsIndex: number[]): RenderInfo => {
        /** Distamce from the top of container's visible part to its content bottom: */
        const upperBound = scrollHeight - scrollTop + bufferSize;
        /** Distance from the bottom of container's visible part to its content bottom: */
        const lowerBound = scrollHeight - scrollTop - offsetHeight - bufferSize;

        const rangeId = upperBound >> 10;

        const rangeTopItemIdx = itemInfos.length - 1 - (itemOffsetsIndex[rangeId] || 0);

        let paddingTop: number | null = null;
        let paddingBottom = 0;
        const itemIds: (string | number)[] = [];

        for (let idx = rangeTopItemIdx; idx < itemInfos.length; idx++) {
            const [id, sizing] = itemInfos[idx];
            if (sizing.bottom > upperBound) {
                continue;
            }

            itemIds.unshift(id);

            const itemTop = sizing.height + sizing.bottom;

            if (itemTop < lowerBound) {
                paddingBottom = itemTop;
                break;
            }

            if (itemTop >= upperBound && sizing.bottom <= upperBound && paddingTop === null) {
                const topItem = itemInfos[0][1];
                paddingTop = topItem.bottom + topItem.height - itemTop;
            }
        }

        paddingTop = paddingTop ?? 0;

        return { items: itemIds, paddingBottom, paddingTop };
    };

const ArchiveListComponent = <T extends { id: string | number },>(props: Props<T>) => {
    const { items, ElementComponent, loadPreviousRecords, renderBufferSize = 3000 } = props;

    const previousItems = useRef<T[]>([]);
    const hasListChanged = !deepEqual(previousItems.current, items);

    /** Stores rendered elements of the items added to DOM during the prev render */
    const renderedItemElementsRef = useRef(new Map<string | number, HTMLDivElement>());

    /** Stores the heights of all known items, populated on their first render, ordered top to bottom */
    const itemHeightsListRef = useRef([] as ItemSizingInfo[]);
    const heights = new Map(itemHeightsListRef.current);

    const itemOffsetsIndex = useRef([] as number[]);

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

    const itemsIds = useMemo(() => items.map(x => x.id), [items]);

    const [renderInfo, setRenderInfo] = useState<RenderInfo>({ items: itemsIds, paddingBottom: 0, paddingTop: 0 });

    const itemsToShow = renderInfo.items.length ? new Set(renderInfo.items) : new Set(itemsIds);
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
        let offsetBottom = knownHeightsList.length
            ? knownHeightsList[0][1].bottom + knownHeightsList[0][1].height
            : 0;
        const knownHeightsMap = new Map(knownHeightsList);

        const newlyRenderedItemsHeights: ItemSizingInfo[] = [];
        const newlyRenderedItems: [string | number, HTMLDivElement][] = [];
        for (const [id, element] of renderedItemElementsRef.current.entries()) {
            if (knownHeightsMap.has(id)) {
                break;
            } else {
                newlyRenderedItems.unshift([id, element]);
            }
        };
        const knownItemsCount = knownHeightsList.length;
        newlyRenderedItems.forEach(([id, element], idx) => {
            itemOffsetsIndex.current[offsetBottom >> 10] = idx + knownItemsCount;
            newlyRenderedItemsHeights.unshift([id, {
                height: element.offsetHeight,
                bottom: offsetBottom
            }]);
            offsetBottom += element.offsetHeight;
        });

        knownHeightsList = newlyRenderedItemsHeights.concat(knownHeightsList);
        itemHeightsListRef.current = knownHeightsList;

        const updatedRenderInfo = getVisibleItems(knownHeightsList, offsetHeight, scrollHeight, scrollTop, renderBufferSize, itemOffsetsIndex.current);

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