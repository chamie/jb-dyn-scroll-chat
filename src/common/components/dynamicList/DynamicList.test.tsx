import { render, screen } from "@testing-library/react";
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
                items={items123}
                loadNextRecords={nop}
                onHitBottom={nop}
                ElementComponent={IdNameItemComponent}
            />
        )

        // Assert
        expect(screen.getByTestId("lower-loader")).toBeInTheDocument();
    });
})