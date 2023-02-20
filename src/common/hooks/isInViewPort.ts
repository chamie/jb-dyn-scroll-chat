import { useEffect, useMemo, MutableRefObject } from "react";

export const useIsInViewport = (ref: MutableRefObject<any>, callback: (isInViewport: boolean) => void) => {
    const observer = useMemo(
        () =>
            new IntersectionObserver(([entry]) =>
                callback(entry.isIntersecting),
            ),
        [callback],
    );

    useEffect(() => {
        ref.current &&
            observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [ref, observer]);
}

// Based on the code from this article: https://bobbyhadz.com/blog/react-check-if-element-in-viewport
// Couldn't find licensing conditions, so just mentioning.