import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
    firstVisibleItemIdx: number,
    lastVisibleItemIdx: number,
    paddingTop: number,
    paddingBottom: number,
}

const deepEqual = memoizeOne(_deepEqual);

/**
 * Calculates which items should be rendered in the scroll container given the sizes and scroll position
 * @param itemPositions size and id for each known item, ordered from top to bottom
 * @param offsetHeight scrolling container's height
 * @param scrollHeight scrolling container's scrollHeight
 * @param scrollTop scrolling container's scrollTop
 * @param bufferSize size of the area that is not visible but should be rendered
 * @returns ids of the items to be rendered given these sizes and the scroll position, and padding sizes that would substitute the non-rendered items.
 */
const getRenderBounds =
    (itemPositions: readonly ItemSizingInfo[], offsetHeight: number, scrollHeight: number, scrollTop: number, bufferSize: number, itemOffsetsIndex: number[]): RenderInfo => {
        if(!itemPositions.length){
            return {
                firstVisibleItemIdx: 0,
                lastVisibleItemIdx: 0,
                paddingBottom: 0,
                paddingTop: 0,
            };
        }

        /** Distamce from the top of container's visible part to its content bottom: */
        const upperBound = scrollHeight - scrollTop + bufferSize;
        /** Distance from the bottom of container's visible part to its content bottom: */
        const lowerBound = scrollHeight - scrollTop - offsetHeight - bufferSize;

        const upperBoundRangeId = upperBound >> 10;
        const upperBoundSearchStartIdx = itemOffsetsIndex[upperBoundRangeId] === undefined
            ? 0
            : itemPositions.length - 1 - itemOffsetsIndex[upperBoundRangeId];

        let firstVisibleItemIdx = 0;
        for (let idx = upperBoundSearchStartIdx; idx < itemPositions.length; idx++) {
            const { bottom } = itemPositions[idx][1];
            if (bottom < upperBound) {
                firstVisibleItemIdx = idx;
                break;
            }
        }
        const topItemPosition = itemPositions[0][1];
        const topItemTop = topItemPosition.bottom + topItemPosition.height;

        const firstVisibleItemPosition = itemPositions[firstVisibleItemIdx][1];
        const firstVisibleItemTop = firstVisibleItemPosition.height + firstVisibleItemPosition.bottom;

        const paddingTop = topItemTop - firstVisibleItemTop;

        const lowerBoundRangeId = lowerBound >> 10;
        const lowerBoundSearchStartIdx = itemOffsetsIndex[lowerBoundRangeId] === undefined
            ? 0
            : itemPositions.length - 1 - itemOffsetsIndex[lowerBoundRangeId];

        let lastVisibleItemIdx = itemPositions.length - 1;

        for (let idx = lowerBoundSearchStartIdx; idx < itemPositions.length; idx++) {
            const { height, bottom } = itemPositions[idx][1];
            const top = height + bottom;
            if (top > lowerBound && bottom <= lowerBound) {
                lastVisibleItemIdx = idx;
                break
            }
        }
        const paddingBottom = itemPositions[lastVisibleItemIdx][1].bottom;

        return { firstVisibleItemIdx, lastVisibleItemIdx, paddingBottom, paddingTop };
    };

const ArchiveListComponent = <T extends { id: string | number },>(props: Props<T>) => {
    const { items, ElementComponent, loadPreviousRecords, renderBufferSize = 3000 } = props;

    const previousItems = useRef<T[]>([]);
    const hasListChanged = previousItems.current !== items;

    /** Stores rendered elements of the items added to DOM during the prev render */
    const renderedItemElementsRef = useRef(new Map<string | number, HTMLDivElement>());

    /** Stores the heights of all known items, populated on their first render, ordered top to bottom */
    const itemHeightsListRef = useRef([] as ItemSizingInfo[]);

    const itemPositionsIndex = useRef([] as number[]);

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

    const [renderInfo, setRenderInfo] = useState<RenderInfo>({ firstVisibleItemIdx: 0, lastVisibleItemIdx: items.length - 1, paddingBottom: 0, paddingTop: 0 });

    let { lastVisibleItemIdx } = renderInfo;
    lastVisibleItemIdx = lastVisibleItemIdx === -1 ? items.length - 1 : lastVisibleItemIdx;

    const firstVisibleItemIdx = itemHeightsListRef.current.length === items.length
        ? renderInfo.firstVisibleItemIdx
        : 0;

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
            debugger;
        }

        /** Numbering: top to bottom */
        let knownHeightsList = itemHeightsListRef.current;
        let offsetBottom = knownHeightsList.length
            ? knownHeightsList[0][1].bottom + knownHeightsList[0][1].height
            : 0;

        const topKnownItemId = knownHeightsList[0]
            ? knownHeightsList[0][0]
            : Infinity;

        const newlyRenderedItemsHeights: ItemSizingInfo[] = [];
        const newlyRenderedItems: [string | number, HTMLDivElement][] = [];
        for (const [id, element] of renderedItemElementsRef.current.entries()) {
            if (id >= topKnownItemId) { // TODO: check if could be done without relying on the IDs being sorted
                break;
            } else {
                newlyRenderedItems.unshift([id, element]);
            }
        };
        const knownItemsCount = knownHeightsList.length;
        newlyRenderedItems.forEach(([id, element], idx) => {
            itemPositionsIndex.current[offsetBottom >> 10] = idx + knownItemsCount;
            newlyRenderedItemsHeights.unshift([id, {
                height: element.offsetHeight,
                bottom: offsetBottom
            }]);
            offsetBottom += element.offsetHeight;
        });

        knownHeightsList = newlyRenderedItemsHeights.concat(knownHeightsList);
        itemHeightsListRef.current = knownHeightsList;

        const updatedRenderInfo = getRenderBounds(knownHeightsList, offsetHeight, scrollHeight, scrollTop, renderBufferSize, itemPositionsIndex.current);

        if (!deepEqual(updatedRenderInfo, renderInfo)) {
            setRenderInfo(updatedRenderInfo);
        }
    }

    const saveItemElementRef = useCallback((itemId: string | number) => (element: HTMLDivElement) => {
        if (!element) {
            return;
        }
        renderedItemElementsRef.current.set(itemId, element);
    }, []);

    const getItems = () => {
        const results = [] as JSX.Element[];
        for (let idx = firstVisibleItemIdx; idx <= lastVisibleItemIdx; idx++) {
            const item = items[idx];
            results.push(
                <div
                    className={styles.item}
                    data-divider={!(idx % 20) ? ">============================================<" : undefined}
                    data-testid="item"
                    ref={saveItemElementRef(item.id)}
                    key={item.id}>
                    <ElementComponent {...item} key={item.id} />
                </div>
            )
        }
        return results;
    }

    return (
        <div ref={containerRef} className={styles.container} onScroll={onScroll} data-testid="list-container">
            {
                loadPreviousRecords &&
                <div data-testid="upper-loader" className={styles['edgeline-loader']}>Loading more…</div>
            }

            <div className={styles.items} style={{ paddingTop, paddingBottom }}>
                {getItems()}
            </div>
        </div>)
};

export const ArchiveList = React.memo(ArchiveListComponent) as typeof ArchiveListComponent;