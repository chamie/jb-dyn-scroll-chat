import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
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

let prevScrollHeight = 0;

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
        if (!itemPositions.length) {
            return {
                firstVisibleItemIdx: 0,
                lastVisibleItemIdx: 0,
                paddingBottom: 0,
                paddingTop: 0,
            };
        }

        const getIndexFromOppositeEnd = (index: number) => itemPositions.length - index - 1;

        /** Distance from the top of container's visible part to its content bottom
         * ```
         *   ┌──┐
         *  ┌┼──┼┐  ─┐
         *  ││  ││   │
         *  ││  ││   │
         *  └┼──┼┘   ├── this thing (+ buffer size)
         *   └──┘   ─┘
         * ```
        */
        const upperBound = scrollHeight - scrollTop + bufferSize;
        /** Distance from the bottom of container's visible part to its content bottom:
         * ```
         *   ┌──┐
         *  ┌┼──┼┐
         *  ││  ││
         *  ││  ││
         *  └┼──┼┘  ─┬── this thing (- buffer size)
         *   └──┘   ─┘
         * ```
        */
        const lowerBound = scrollHeight - scrollTop - offsetHeight - bufferSize;

        const upperBoundRangeId = upperBound >> 10;
        const upperBoundSearchStartIdx = itemOffsetsIndex[upperBoundRangeId] === undefined
            ? 0
            : getIndexFromOppositeEnd(itemOffsetsIndex[upperBoundRangeId]);

        let firstVisibleItemIdxFromTop = 0;
        for (let idx = upperBoundSearchStartIdx; idx < itemPositions.length; idx++) {
            const { bottom } = itemPositions[idx][1];
            if (bottom < upperBound) {
                firstVisibleItemIdxFromTop = idx;
                break;
            }
        }
        const firstVisibleItemIdx = getIndexFromOppositeEnd(firstVisibleItemIdxFromTop);
        const topItemPosition = itemPositions[0][1];
        const topItemTop = topItemPosition.bottom + topItemPosition.height;

        const firstVisibleItemPosition = itemPositions[firstVisibleItemIdxFromTop][1];
        const firstVisibleItemTop = firstVisibleItemPosition.height + firstVisibleItemPosition.bottom;

        const paddingTop = topItemTop - firstVisibleItemTop;

        const lowerBoundRangeId = lowerBound >> 10;
        const lowerBoundSearchStartIdx = itemOffsetsIndex[lowerBoundRangeId] === undefined
            ? 0
            : itemPositions.length - 1 - itemOffsetsIndex[lowerBoundRangeId];

        let lastVisibleItemIdxFromTop = itemPositions.length - 1;

        for (let idx = lowerBoundSearchStartIdx; idx < itemPositions.length; idx++) {
            const { height, bottom } = itemPositions[idx][1];
            const top = height + bottom;
            if (top > lowerBound && bottom <= lowerBound) {
                lastVisibleItemIdxFromTop = idx;
                break
            }
        }
        const lastVisibleItemIdx = getIndexFromOppositeEnd(lastVisibleItemIdxFromTop);
        const paddingBottom = itemPositions[lastVisibleItemIdxFromTop][1].bottom;

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

    const containerRef = useRef<HTMLDivElement>(null);

    const [renderInfo, setRenderInfo] = useState<RenderInfo>({ firstVisibleItemIdx: 0, lastVisibleItemIdx: 0, paddingBottom: 0, paddingTop: 0 });

    let { lastVisibleItemIdx } = renderInfo;
    lastVisibleItemIdx = lastVisibleItemIdx === -1 ? items.length - 1 : lastVisibleItemIdx;

    const firstVisibleItemIdx = hasListChanged
        ? items.length - 1
        : renderInfo.firstVisibleItemIdx;
    const paddingTop = hasListChanged
        ? 0
        : renderInfo.paddingTop;

    const saveListItemElementRef = useCallback((itemId: string | number) => (element: HTMLDivElement) => {
        if (!element) {
            return;
        }
        renderedItemElementsRef.current.set(itemId, element);
    }, []);

    const listItems = [] as JSX.Element[];

    const lastVisibleItemIdxFromTop = items.length - lastVisibleItemIdx - 1;
    const firstVisibleItemIdxFromTop = items.length - firstVisibleItemIdx - 1;

    if (items.length) {
        for (let idx = firstVisibleItemIdxFromTop; idx <= lastVisibleItemIdxFromTop; idx++) {
            const item = items[idx];

            listItems.push(
                <div
                    className={styles.item}
                    data-divider={!(idx % 20) ? ">============================================<" : undefined}
                    data-testid="item"
                    ref={saveListItemElementRef(item.id)}
                    key={item.id}>
                    <ElementComponent {...item} key={item.id} />
                </div>
            )
        }
    }

    renderedItemElementsRef.current.clear();

    const { paddingBottom } = renderInfo;

    /**
     * How far is is the container scrolled from bottom;
     */
    let scrollBottom = 0;
    if (containerRef.current) {
        const { scrollTop, scrollHeight } = containerRef.current;
        scrollBottom = scrollHeight - scrollTop;
        const itemsRendered = firstVisibleItemIdx - lastVisibleItemIdx + 1;
        console.log("In Render:");
        console.table({
            "items total": items.length, itemsRendered,
            lastVisibleItemIdx, firstVisibleItemIdx
        });
    }

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

            // If list is populated for the first time, scroll to bottom
            if (!previousItems.current.length && items.length) {
                containerElement.scrollTop = containerElement.scrollHeight;
            } else {
                const { scrollHeight } = containerElement;
                prevScrollHeight = scrollHeight;
                const listHeight = containerElement.querySelector("div:nth-child(2)")?.scrollHeight;
                console.log("In Effect:");
                const scrollTop = scrollHeight - scrollBottom;
                console.table({ scrollHeight, prevScrollHeight, listHeight, scrollBottom, scrollTop });
                containerElement.scrollTop = scrollTop;
            }

            previousItems.current = items;

            //});
        }, [items, hasListChanged, scrollBottom]);

    const wasLoadPrevCalled = useRef(false);

    // reset to false on list change
    wasLoadPrevCalled.current = !hasListChanged && wasLoadPrevCalled.current;

    const onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        if (skipOnScroll.current) {
            skipOnScroll.current = false;
            return;
        }

        console.log("OnScroll triggered");

        const { scrollTop, scrollHeight, offsetHeight } = event.currentTarget;

        if (scrollTop <= renderBufferSize && loadPreviousRecords && !wasLoadPrevCalled.current) {
            wasLoadPrevCalled.current = true;
            loadPreviousRecords();
        }

        /** Numbering: top to bottom */
        let knownPositionsList = itemHeightsListRef.current;
        let offsetBottom = knownPositionsList.length
            ? knownPositionsList[0][1].bottom + knownPositionsList[0][1].height
            : 0;

        const topKnownItemId = knownPositionsList[0]
            ? knownPositionsList[0][0]
            : Infinity;

        const newlyRenderedItemsHeights: ItemSizingInfo[] = [];
        const newlyRenderedItems: [string | number, HTMLDivElement][] = [];
        for (const [id, element] of renderedItemElementsRef.current.entries()) {
            if (id >= topKnownItemId) { // TODO: check if this could be done without relying on the IDs being sorted
                break;
            } else {
                newlyRenderedItems.unshift([id, element]);
            }
        };
        const knownItemsCount = knownPositionsList.length;
        newlyRenderedItems.forEach(([id, element], idx) => {
            itemPositionsIndex.current[offsetBottom >> 10] = idx + knownItemsCount;
            newlyRenderedItemsHeights.unshift([id, {
                height: element.offsetHeight,
                bottom: offsetBottom
            }]);
            offsetBottom += element.offsetHeight;
        });

        knownPositionsList = newlyRenderedItemsHeights.concat(knownPositionsList);
        itemHeightsListRef.current = knownPositionsList;

        const updatedRenderInfo = getRenderBounds(knownPositionsList, offsetHeight, scrollHeight, scrollTop, renderBufferSize, itemPositionsIndex.current);

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
                {listItems}
            </div>
        </div>)
};

export const ArchiveList = React.memo(ArchiveListComponent) as typeof ArchiveListComponent;