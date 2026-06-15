type OptimizableFunction<T extends Node> = (child: T) => T;

const optimize = <T extends Node>(orig: OptimizableFunction<T>) => {
    return function (this: Element, ...args: [Element]): T {
        return orig.apply(this, args as unknown as [T]);
    } as unknown as OptimizableFunction<T>;
};

// eslint-disable-next-line @typescript-eslint/unbound-method
Element.prototype.removeChild = optimize(Element.prototype.removeChild);
