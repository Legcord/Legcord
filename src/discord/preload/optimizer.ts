const optimize = (orig: Function) =>
    function (this: any, ...args: any[]) {
        if (typeof args[0]?.className === "string" && args[0].className.indexOf("activity") !== -1)
            return setTimeout(() => orig.apply(this, args), 100);

        return orig.apply(this, args);
    };

Element.prototype.removeChild = optimize(Element.prototype.removeChild);
