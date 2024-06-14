type OptimizableFunction<T extends Node> = (child: T) => T;

const optimize = <T extends Node>(orig: OptimizableFunction<T>) => {
    return function (this: Element, ...args: [Element]) {
        if (typeof args[0]?.className === "string" && args[0].className.indexOf("activity") !== -1) {
            // @ts-expect-error - // FIXME
            return setTimeout(() => orig.apply(this, args), 100);
        }
        // @ts-expect-error - // FIXME
        return orig.apply(this, args);
    } as unknown as OptimizableFunction<T>;
};

// We are taking in the function itself
// eslint-disable-next-line @typescript-eslint/unbound-method
Element.prototype.removeChild = optimize(Element.prototype.removeChild);

// Thanks Ari - <@1249446413952225452>
