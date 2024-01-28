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
                        (path) => [+pid, path.replaceAll("0", "")],
                        () => 0
                    )
            )
        )
    ).filter((x) => x);
module.exports = {getProcesses};
