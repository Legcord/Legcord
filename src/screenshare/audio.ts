import {spawn} from "child_process";
import fs from "fs";
import {app} from "electron";
import path from "path";

// quick and dirty way for audio screenshare on Linux
// please PR a better non-shell solution that isn't a dependency mess
//src https://github.com/edisionnano/Screenshare-with-audio-on-Discord-with-Linux
interface SinkInput {
    id: string;
    properties: Record<string, string>;
}

const parseSinkInputs = (input: string): SinkInput[] => {
    const regex = /Sink Input #(\d+)\n([\s\S]+?)(?=\nSink Input #|\n{2,}|$)/g;
    const result: SinkInput[] = [];
    let match;

    while ((match = regex.exec(input))) {
        const sinkInput: SinkInput = {
            id: match[1],
            properties: {}
        };

        const propertiesRegex = /(\w+)\s*=\s*"([^"]*)"/g;
        let propertiesMatch;

        while ((propertiesMatch = propertiesRegex.exec(match[2]))) {
            sinkInput.properties[propertiesMatch[1]] = propertiesMatch[2];
        }

        result.push(sinkInput);
    }

    return result;
};

export function createVirtualDevice(sinkInput: number) {
    var script = `
    SINK_NAME=armcord
    export LC_ALL=C
    DEFAULT_OUTPUT=$(pactl info|sed -n -e 's/^.*Default Sink: //p')
    pactl load-module module-null-sink sink_name=$SINK_NAME
    pactl move-sink-input ${sinkInput} $SINK_NAME
    pactl load-module module-loopback source=$SINK_NAME.monitor sink=$DEFAULT_OUTPUT
    if pactl info|grep -w "PipeWire">/dev/null; then
        nohup pw-loopback --capture-props='node.target='$SINK_NAME --playback-props='media.class=Audio/Source node.name=virtmic node.description="virtmic"' >/dev/null &
    else
        pactl load-module module-remap-source master=$SINK_NAME.monitor source_name=virtmic source_properties=device.description=virtmic
    fi`;
    let scriptPath = path.join(app.getPath("temp"), "/", "script.sh");
    spawn("chmod +x " + scriptPath);
    fs.writeFileSync(scriptPath, script, "utf-8");
    const exec = spawn(scriptPath);
}

export function isAudioSupported(): boolean {
    const pactl = spawn("pactl");

    pactl.on("close", (code) => {
        if (code == 0) {
            return true;
        }
    });
    return false;
}
export function getSinks() {
    const pactl = spawn("pactl list sink-inputs");

    pactl.stderr.on("data", (data) => {
        console.log(data);
        return parseSinkInputs(data);
    });
    pactl.on("close", (code) => {
        if (code !== 0) {
            throw Error("Couldn't get list of available apps for audio stream");
        }
    });
}
