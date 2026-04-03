type OptimizableFunction<T extends Node> = (child: T) => T;

const timeouts = new WeakMap<Element, ReturnType<typeof setTimeout>>();

const optimize = <T extends Node>(orig: OptimizableFunction<T>) => {
    return function (this: Element, ...args: [Element]) {
        // Clear any existing timeout for this element
        const existingTimeout = timeouts.get(this);
        if (existingTimeout) clearTimeout(existingTimeout);

        if (typeof args[0]?.className === "string" && args[0].className.includes("activity")) {
            const timeout = setTimeout(() => {
                // @ts-expect-error - // FIXME
                orig.apply(this, args);
                timeouts.delete(this);
            }, 100);
            timeouts.set(this, timeout);
            return;
        }
        // @ts-expect-error - // FIXME
        return orig.apply(this, args);
    } as unknown as OptimizableFunction<T>;
};

// We are taking in the function itself
// eslint-disable-next-line @typescript-eslint/unbound-method
Element.prototype.removeChild = optimize(Element.prototype.removeChild);

// Thanks Ari - <@1249446413952225452>
