type OptimizableFunction<T extends Node> = (child: T) => T;

const optimize = <T extends Node>(orig: OptimizableFunction<T>) => {
    return function (this: Element, ...args: [Element]): T | number {
        if (typeof args[0]?.className === "string" && args[0].className.includes("activity")) {
            // fix by xql.dev <@1356430365774053448>
            setTimeout(() => orig.apply(this, args as unknown as [T]), 100);
            return args[0] as unknown as T;
        }
        return orig.apply(this, args as unknown as [T]);
    } as unknown as OptimizableFunction<T>;
};

// We are taking in the function itself
// eslint-disable-next-line @typescript-eslint/unbound-method
Element.prototype.removeChild = optimize(Element.prototype.removeChild);

// Thanks Ari - <@1249446413952225452>
