const {readlink, readdir} = require("fs/promises");

const getProcesses = async () => {
    const pids = (await readdir("/proc")).filter((f) => !isNaN(+f));
    return (
        await Promise.all(
            pids.map((pid) =>
                readlink(`/proc/${pid}/exe`).then(
                    (path) => [+pid, path],
                    () => {}
                )
            )
        )
    ).filter((x) => x);
};
module.exports = {getProcesses};
