const {exec} = require("child_process");

const getProcesses = () =>
    new Promise((res) =>
        exec(`wmic process get ProcessID,ExecutablePath /format:csv`, (e, out) => {
            res(
                out
                    .toString()
                    .split("\r\n")
                    .slice(2)
                    .map((x) => {
                        const parsed = x.trim().split(",").slice(1).reverse();
                        parsed[0] = parseInt(parsed[0]) || parsed[0]; // pid to int
                        return parsed;
                    })
                    .filter((x) => x[1])
            );
        })
    );
module.exports = getProcesses;
