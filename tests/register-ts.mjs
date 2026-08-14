import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (typeof specifier === "string" && specifier.endsWith(".js") && specifier.startsWith(".")) {
            const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
            const tsPath = join(dirname(parent), specifier.replace(/\.js$/, ".ts"));
            if (existsSync(tsPath)) {
                return { url: pathToFileURL(tsPath).href, shortCircuit: true };
            }
        }
        return nextResolve(specifier, context);
    },
});
