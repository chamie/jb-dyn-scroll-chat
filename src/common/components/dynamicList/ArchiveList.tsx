import React, { useLayoutEffect, useRef, useState } from "react";
import { deepEqual as _deepEqual } from "../../tools";
import styles from './DynamicList.module.css';
import memoizeOne from "memoize-one";
import { ItemSizingInfo } from "./itemSizing";

const indexRangeOrder = 10;

export type Props<T> = {
    items: T[],
    ElementComponent: React.ComponentType<T>,
    loadPreviousRecords?: () => void,
    renderBufferSize?: number,
}

type RenderBounds = {
    /** counted from bottom, so to remain valid when new items are added on top */
    firstVisibleItemIdx?: number,
    /** counted from bottom, so to remain valid when new items are added on top */
    lastVisibleItemIdx: number,
    paddingTop: number,
    paddingBottom: number,
}

const deepEqual = memoizeOne(_deepEqual);

/**
 * Calculates which items should be rendered in the scroll container given the sizes and scroll position
 * @param itemPositions size and id for each known item, ordered from top to bottom
 * @param container scrolling container element
 * @param bufferSize size of the area that is not visible but should be rendered
 * @param itemOffsetsIndex stores bottom-up indexes for items that start each (2^indexRangeOrder)-pixel-high range, i.e. [12,23] means range 0 starts with item #12, and range 1 starts with item #23. So each search takes not more than (rangeSize/minimumItemHeight) iterations.
 * @returns ids of the items to be rendered given these sizes and the scroll position, and padding sizes that would substitute the non-rendered items.
 */
const getRenderBounds =
    (itemPositions: readonly ItemSizingInfo[], container: HTMLElement, bufferSize: number, itemOffsetsIndex: number[]): RenderBounds => {
        if (!itemPositions.length) {
            return {
                firstVisibleItemIdx: 0,
                lastVisibleItemIdx: 0,
                paddingBottom: 0,
                paddingTop: 0,
            };
        }

        const {clientHeight, scrollHeight, scrollTop} = container;

        const getIndexFromOppositeEnd = (index: number) => itemPositions.length - index - 1;

        /** Distance from the top of container's visible part to its content bottom
         * ```
         *     ┌── content
         *   ┌──┐
         *  ┌┼──┼┐ ─┐
         *  ││  ││──│───viewport
         *  ││  ││  │
         *  └┼──┼┘  ├── this distance (+ buffer size)
         *   └──┘  ─┘
         * ```
        */
        const upperBound = scrollHeight - scrollTop + bufferSize;
        /** Distance from the bottom of container's visible part to its content bottom:
         * ```
         *     ┌── content
         *   ┌──┐
         *  ┌┼──┼┐
         *  ││  ││-viewport
         *  ││  ││
         *  └┼──┼┘ ─┬── this distance (- buffer size)
         *   └──┘  ─┘
         * ```
        */
        const lowerBound = scrollHeight - scrollTop - clientHeight - bufferSize;

        const upperBoundRangeId = upperBound >> indexRangeOrder;
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
        const topItemTop = itemPositions[0][1].top;
        const firstVisibleItemTop = itemPositions[firstVisibleItemIdxFromTop][1].top;

        const paddingTop = topItemTop - firstVisibleItemTop;

        const lowerBoundRangeId = lowerBound >> indexRangeOrder;
        const lowerBoundSearchStartIdx = itemOffsetsIndex[lowerBoundRangeId] === undefined
            ? 0
            : itemPositions.length - 1 - itemOffsetsIndex[lowerBoundRangeId];

        let lastVisibleItemIdxFromTop = itemPositions.length - 1;

        for (let idx = lowerBoundSearchStartIdx; idx < itemPositions.length; idx++) {
            const { top, bottom } = itemPositions[idx][1];
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
    const { items, ElementComponent, loadPreviousRecords, renderBufferSize = 1000 } = props;

    const previousItems = useRef<T[]>([]);
    const hasListChanged = previousItems.current !== items;
    const wasListScrollable = useRef(false);

    /** Stores rendered elements of the items added to DOM during the prev render */
    const renderedItemElementsRef = useRef(new Map<string | number, HTMLDivElement>());

    /** Stores the heights of all known items, populated on their first render, ordered top to bottom */
    const itemHeightsListRef = useRef([] as ItemSizingInfo[]);

    /** Stores the index (in the itemHeightsListRef array) of the top item
     * for each (2^indexRangeOrder)-pixel-high rendering range */
    const itemPositionsIndex = useRef([] as number[]);

    const containerRef = useRef<HTMLDivElement>(null);

    const [renderBounds, setRenderBounds] = useState<RenderBounds>({
        lastVisibleItemIdx: 0,
        paddingBottom: 0,
        paddingTop: 0,
    });

    const saveListItemElementRef = (itemId: string | number) => (element: HTMLDivElement) => {
        if (!element) {
            return;
        }
        renderedItemElementsRef.current.set(itemId, element);
    };

    const listItems = [] as JSX.Element[];

    // If list was changed (new items added) — force-render them to know the heights and positions
    const firstVisibleItemIdxFromTop = hasListChanged || renderBounds.firstVisibleItemIdx === undefined
        ? 0
        : items.length - renderBounds.firstVisibleItemIdx - 1;

    const paddingTop = hasListChanged
        ? 0
        : renderBounds.paddingTop;

    // If never initialized — show the list to the end
    const lastVisibleItemIdxFromTop = items.length - renderBounds.lastVisibleItemIdx - 1;

    if (items.length) {
        for (let idx = firstVisibleItemIdxFromTop; idx <= lastVisibleItemIdxFromTop; idx++) {
            const item = items[idx];

            listItems.push(
                <div
                    className={styles.item}
                    data-strobe={!(idx % 10) ? ">============================================<" : undefined}
                    data-testid="item"
                    ref={saveListItemElementRef(item.id)}
                    key={item.id}>
                    <ElementComponent {...item} key={item.id} />
                </div>
            )
        }
    }

    renderedItemElementsRef.current.clear();

    const { paddingBottom } = renderBounds;

    /** How far is is the container scrolled from bottom */
    let scrollBottom = 0;
    if (containerRef.current) {
        const { scrollTop, scrollHeight } = containerRef.current;
        scrollBottom = scrollHeight - scrollTop;
    }

    let shouldSkipOnScroll = false;

    const detectNewItems = () => {
        /** Numbering: top to bottom */
        let knownPositionsList = itemHeightsListRef.current;

        const topKnownItemId = knownPositionsList[0]
            ? knownPositionsList[0][0]
            : Infinity;

        const topKnownItemTop = knownPositionsList[0]
            ? knownPositionsList[0][1].top
            : 0;

        const newlyRenderedItemsHeights: ItemSizingInfo[] = [];
        const newlyRenderedItems: [string | number, HTMLDivElement][] = [];
        let knownItemsCount = knownPositionsList.length;
        for (const [id, element] of renderedItemElementsRef.current.entries()) {
            const parentOffsetHeight = (element.offsetParent as HTMLElement).scrollHeight;
            const offsetFromBottom = parentOffsetHeight - element.offsetTop;
            if (offsetFromBottom <= topKnownItemTop || id === topKnownItemId) {
                break;
            } else {
                // Unshift so we can iterate bottom-up later
                newlyRenderedItems.unshift([id, element]);
            }
        };

        knownItemsCount = knownPositionsList.length;
        newlyRenderedItems.forEach(([id, element], idx) => {
            const parentOffsetHeight = (element.offsetParent as HTMLElement).scrollHeight;
            const offsetFromBottom = parentOffsetHeight - element.offsetTop;
            itemPositionsIndex.current[offsetFromBottom >> indexRangeOrder] = idx + knownItemsCount;
            // Unshift again so the resulting array is reversed back to top-down order, in line with the rendering order
            newlyRenderedItemsHeights.unshift([id, {
                top: offsetFromBottom,
                bottom: offsetFromBottom - element.offsetHeight,
            }]);
        });

        knownPositionsList = newlyRenderedItemsHeights.concat(knownPositionsList);
        itemHeightsListRef.current = knownPositionsList;
    };

    useLayoutEffect(
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

            const isListScrollable = containerElement.scrollHeight > containerElement.clientHeight;

            // We gonna adjust scrolling here, so disable scroll handling once.
            // Yes, we are fine with it being reset on next render, whenever it happens.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            shouldSkipOnScroll = true;

            // If list is populated for the first time, scroll to bottom
            if (!wasListScrollable.current && isListScrollable) {
                containerElement.scrollTop = containerElement.scrollHeight;
            } else {
                const { scrollHeight } = containerElement;
                const scrollTop = scrollHeight - scrollBottom;
                containerElement.scrollTop = scrollTop;
            }

            wasListScrollable.current = isListScrollable;

            previousItems.current = items;

            detectNewItems();
            //});
        });

    const wasLoadPrevCalled = useRef(false);

    // reset to false on list change
    wasLoadPrevCalled.current = !hasListChanged && wasLoadPrevCalled.current;

    const onScroll = () => {
        if (shouldSkipOnScroll) {
            shouldSkipOnScroll = false;
            return;
        }

        if (!containerRef.current) {
            return;
        }

        // Detect edge and load more records:
        if (containerRef.current.scrollTop <= renderBufferSize && loadPreviousRecords && !wasLoadPrevCalled.current) {
            wasLoadPrevCalled.current = true;
            loadPreviousRecords();
        }

        // Update render bounds:
        const updatedRenderBounds = getRenderBounds(itemHeightsListRef.current, containerRef.current, renderBufferSize, itemPositionsIndex.current);

        if (!deepEqual(updatedRenderBounds, renderBounds)) {
            setRenderBounds(updatedRenderBounds);
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