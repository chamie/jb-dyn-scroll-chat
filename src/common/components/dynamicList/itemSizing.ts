export type ItemSizingInfo = [
    /** item ID */
    string | number,
    {
        /** item rendered size */
        height: number,
        bottom: number,
    }
];