const {readFile, readdir} = require("fs/promises");

const getProcesses = async () =>
    (
        await Promise.all(
            (
                await readdir("/proc")
            ).map(
                (pid) =>
                    +pid > 0 &&
                    readFile(`/proc/${pid}/cmdline`, "utf8").then(
                        (path) => [+pid, path.split("\0")[0], path.split("\0").slice(1)],
                        () => 0
                    )
            )
        )
    ).filter((x) => x);
module.exports = {getProcesses};
