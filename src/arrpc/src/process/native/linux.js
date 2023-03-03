const {exec} = require("child_process");
const {readlink} = require("fs/promises");

const getProcesses = () =>
    new Promise((res) =>
        exec(`ps a -o "%p;%c;%a"`, async (e, out) => {
            res(
                (
                    await Promise.all(
                        out
                            .toString()
                            .split("\n")
                            .slice(1, -1)
                            .map(async (x) => {
                                const split = x.trim().split(";");
                                // if (split.length === 1) return;

                                const pid = parseInt(split[0].trim());
                                const cmd = split[1].trim();
                                const argv = split.slice(2).join(";").trim();

                                const path = await readlink(`/proc/${pid}/exe`).catch((e) => {}); // read path from /proc/{pid}/exe symlink

                                return [pid, path];
                            })
                    )
                ).filter((x) => x && x[1])
            );
        })
    );
module.exports = {getProcesses};
