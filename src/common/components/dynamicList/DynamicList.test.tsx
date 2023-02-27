import { fireEvent, getByTestId, render, screen } from "@testing-library/react";
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

const IdNameItemComponent: React.ComponentType<Item> = (item) => <>{item.id}: {item.text}</>;

describe('Dynamic list component', () => {
    it('should render empty list as empty markup', async () => {
        // Arrange
        const items: { id: number }[] = [];
        const elementComponent: React.ComponentType<{ id: number }> = ({ id }) => (<>{id}</>);


        const mockUseInViewPort = uivp.useIsInViewport as jest.Mock<typeof uivp>;
        mockUseInViewPort.mockImplementation();

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
        const scrillTopInitialRender = containerElement.scrollTop;

        containerElement.scrollTop = 100;

        view.rerender(
            <DynamicList
                items={itemsLongList}
                ElementComponent={IdNameItemComponent}
                onHitBottom={nop}
            />
        );
        containerElement = screen.getByTestId("list-container");
        const scrillTopReRender = containerElement.scrollTop;

        // Assert
        expect(scrillTopInitialRender).toBe(500);
        expect(scrillTopReRender).toBe(500);
    });

    it('should stop keeping the list scrolled to bottom on user scroll', () => {
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
        const scrillTopInitialRender = containerElement.scrollTop;

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
        const scrillTopReRender = containerElement.scrollTop;

        // Assert
        expect(scrillTopInitialRender).toBe(500);
        expect(scrillTopReRender).toBe(100);
    });

})