import { fireEvent, render, screen } from "@testing-library/react";
import { DynamicList } from "./DynamicList";
import * as uivp from "../../hooks/isInViewPort";

jest.mock<typeof uivp>("../../hooks/isInViewPort");

const nop = () => { };

type Item = {
    id: number,
    text: string,
}
const items123: Item[] = [
    {
        id: 1,
        text: "Test String 1"
    },
    {
        id: 2,
        text: "Test String 2"
    },
    {
        id: 3,
        text: "Test String 3"
    },
];
const itemsLongList: Item[] = new Array(100).fill(undefined).map((_, idx) => ({
    id: idx + 1,
    text: `Test String ${idx + 1}`
}));

const IdNameItemComponent: React.ComponentType<Item> = (item) =>
    <span data-testid={`item${item.id}`}>{item.id}: {item.text}</span>;

describe('Dynamic list component', () => {
    it('should render empty list as empty markup', async () => {
        // Arrange
        const items: { id: number }[] = [];
        const elementComponent: React.ComponentType<{ id: number }> = ({ id }) => (<>{id}</>);

        // Act
        render(
            <DynamicList
                items={items}
                ElementComponent={elementComponent}
                onHitBottom={nop}
            />
        );

        // Assert
        expect(screen.queryByTestId("item")).not.toBeInTheDocument();
    });

    it('should render all the provided items', () => {
        // Arrange       

        // Act
        render(
            <DynamicList
                items={items123}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        )

        // Assert
        expect(screen.queryAllByTestId("item").length).toBe(3);
        items123
            .map(item => `${item.id}: ${item.text}`)
            .forEach(text =>
                expect(screen.getByText(text)).toBeInTheDocument()
            );

    });

    it('should show upper loader when `loadPreviousRecords()` is callback provided', () => {
        // Act
        render(
            <DynamicList
                items={items123}
                loadPreviousRecords={nop}
                onHitBottom={nop}
                ElementComponent={IdNameItemComponent}
            />
        )

        // Assert
        expect(screen.getByTestId("upper-loader")).toBeInTheDocument();
    });

    it('should show lower loader when `loadNextRecords()` is callback provided', () => {
        // Act
        render(
            <DynamicList
                items={itemsLongList}
                loadNextRecords={nop}
                onHitBottom={nop}
                ElementComponent={IdNameItemComponent}
            />)

        // Assert
        expect(screen.getByTestId("lower-loader")).toBeInTheDocument();
    });

    it('should call `loadPreviousRecords()` when upper loader gets visible', () => {
        // Arrange
        const loadPrev = jest.fn();

        const temp = jest.fn(uivp.useIsInViewport);

        const mockUseInViewPort = uivp.useIsInViewport as typeof temp;

        // Act
        render(
            <DynamicList
                items={items123}
                loadPreviousRecords={loadPrev}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        )

        const isInViewPortCallback = mockUseInViewPort.mock.calls[0][1];
        isInViewPortCallback(false);
        isInViewPortCallback(true);

        // Assert
        expect(loadPrev).toHaveBeenCalledTimes(1);
    });

    it('should call `loadNextRecords()` when lower loader gets visible', () => {
        // Arrange
        const loadNext = jest.fn();

        const temp = jest.fn(uivp.useIsInViewport);

        const mockUseInViewPort = uivp.useIsInViewport as typeof temp;

        // Act
        render(
            <DynamicList
                items={items123}
                loadNextRecords={loadNext}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        )

        const isInViewPortCallback = mockUseInViewPort.mock.calls[1][1];
        isInViewPortCallback(false);
        isInViewPortCallback(true);

        // Assert
        expect(loadNext).toHaveBeenCalledTimes(1);
    });

    it('should keep the list scrolled to bottom until user scrolls', () => {
        // Arrange
        jest.spyOn(Element.prototype, 'scrollHeight', 'get')
            .mockImplementation(() => 500);
        jest.spyOn(Element.prototype, 'clientHeight', 'get')
            .mockImplementation(() => 300);

        // Act
        const view = render(
            <DynamicList
                items={items123}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );

        let containerElement = screen.getByTestId("list-container");
        const scrollTopInitialRender = containerElement.scrollTop;

        containerElement.scrollTop = 100;

        view.rerender(
            <DynamicList
                items={itemsLongList}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );
        containerElement = screen.getByTestId("list-container");
        const scrollTopReRender = containerElement.scrollTop;

        // Assert
        expect(scrollTopInitialRender).toBe(500);
        expect(scrollTopReRender).toBe(500);
    });

    fit('should scroll the list to bottom when listId changes', () => {
        // Arrange
        jest.spyOn(Element.prototype, 'scrollHeight', 'get')
            .mockImplementation(() => 500);
        jest.spyOn(Element.prototype, 'clientHeight', 'get')
            .mockImplementation(() => 300);

        // Act
        const view = render(
            <DynamicList
                items={items123}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
                listId={1}
            />
        );

        let containerElement = screen.getByTestId("list-container");
        const scrollTopInitialRender = containerElement.scrollTop;

        containerElement.scrollTop = 100;

        view.rerender(
            <DynamicList
                items={items123}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
                listId={2}
            />
        );
        containerElement = screen.getByTestId("list-container");
        const scrollTopReRender = containerElement.scrollTop;

        // Assert
        expect(scrollTopInitialRender).toBe(500);
        expect(scrollTopReRender).toBe(500);
    });

    it('should stop keeping the list scrolled to bottom after user scroll', () => {
        // Arrange
        jest.spyOn(Element.prototype, 'scrollHeight', 'get')
            .mockImplementation(() => 500);
        jest.spyOn(Element.prototype, 'clientHeight', 'get')
            .mockImplementation(() => 300);

        // Act
        const view = render(
            <DynamicList
                items={items123}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );

        let containerElement = screen.getByTestId("list-container");
        const scrollTopInitialRender = containerElement.scrollTop;

        containerElement.scrollTop = 100;

        fireEvent(containerElement, new MouseEvent('scroll'));

        view.rerender(
            <DynamicList
                items={itemsLongList}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );
        containerElement = screen.getByTestId("list-container");
        const scrollTopReRender = containerElement.scrollTop;

        // Assert
        expect(scrollTopInitialRender).toBe(500);
        expect(scrollTopReRender).toBe(100);
    });

    it('after scrolling from bottom on update keep the list scrolled so that same items are in same place on screen', () => {
        // Arrange
        jest.spyOn(Element.prototype, 'scrollHeight', 'get')
            .mockImplementation(() => 500);

        let scrollTopValue = -1;
        jest.spyOn(Element.prototype, 'clientHeight', 'get')
            .mockImplementation(() => 300);

        jest.spyOn(Element.prototype, 'scrollTop', 'get')
            .mockImplementation(() => 0);
        jest.spyOn(Element.prototype, 'scrollTop', 'set')
            .mockImplementation((value) => scrollTopValue = value);

        const itemOffsetReadCounts: Record<string, number> = {};

        jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get')
            .mockImplementation(function (this: HTMLElement) {
                if (this.dataset.testid === "item") {
                    // eslint-disable-next-line testing-library/no-node-access
                    const testId = this.querySelector("span")?.dataset.testid || "";
                    const countReads = itemOffsetReadCounts[testId] || 1;
                    itemOffsetReadCounts[testId] = countReads + 1;
                    const itemId = parseInt(testId.match(/\d+/)?.[0] || '0');
                    return itemId * 7 * countReads; // 7 is a prime number not a factor of any other used numbers
                }

                return 123;
            });

        const listHead = itemsLongList.slice(0, -20);
        const listFoot = itemsLongList.slice(10, -10);

        // Magic numbers:
        // 123 (default offset value), 7 (item offset multiplicator), 80 (list size) and 11 (matching item index).
        // Rationale: they are all coprime integers,
        // so the expected end result is not achievable by chance.

        // Act
        const view = render(
            <DynamicList
                items={listFoot}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );

        const containerElement = screen.getByTestId("list-container");
        const scrollTopInitialRender = scrollTopValue;

        fireEvent(containerElement, new MouseEvent('scroll'));

        view.rerender(
            <DynamicList
                items={listHead}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );

        const scrollTopReRender = scrollTopValue;

        // Assert
        expect(scrollTopInitialRender).toBe(500);
        expect(scrollTopReRender).toBe(77);

    });

})