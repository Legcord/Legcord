// MIT License

// Copyright (c) 2021 Joseph Watts

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function setLegacyChromeConstraint(constraint, name, value) {
    if (constraint.mandatory && name in constraint.mandatory) {
        constraint.mandatory[name] = value;
        return;
    }
    if (constraint.optional) {
        const element = constraint.optional.find((opt) => name in opt);
        if (element) {
            element[name] = value;
            return;
        }
    }
    // `mandatory` options throw errors for unknown keys, so avoid that by
    // setting it under optional.
    if (!constraint.optional) {
        constraint.optional = [];
    }
    constraint.optional.push({[name]: value});
}
function setConstraint(constraint, name, value) {
    if (constraint.advanced) {
        const element = constraint.advanced.find((opt) => name in opt);
        if (element) {
            element[name] = value;
            return;
        }
    }
    constraint[name] = value;
}
function disableAutogain(constraints) {
    console.log("Automatically unsetting gain!", constraints);
    if (constraints && constraints.audio) {
        if (typeof constraints.audio !== "object") {
            constraints.audio = {};
        }
        if (constraints.audio.optional || constraints.audio.mandatory) {
            setLegacyChromeConstraint(constraints.audio, "googAutoGainControl", false);
            setLegacyChromeConstraint(constraints.audio, "googAutoGainControl2", false);
        } else {
            setConstraint(constraints.audio, "autoGainControl", false);
        }
    }
}

function patchFunction(object, name, createNewFunction) {
    if (name in object) {
        var original = object[name];
        object[name] = createNewFunction(original);
    }
}

patchFunction(navigator.mediaDevices, "getUserMedia", function (original) {
    return function getUserMedia(constraints) {
        disableAutogain(constraints);
        return original.call(this, constraints);
    };
});
function patchDeprecatedGetUserMedia(original) {
    return function getUserMedia(constraints, success, error) {
        disableAutogain(constraints);
        return original.call(this, constraints, success, error);
    };
}
patchFunction(navigator, "getUserMedia", patchDeprecatedGetUserMedia);
patchFunction(navigator, "mozGetUserMedia", patchDeprecatedGetUserMedia);
patchFunction(navigator, "webkitGetUserMedia", patchDeprecatedGetUserMedia);
patchFunction(MediaStreamTrack.prototype, "applyConstraints", function (original) {
    return function applyConstraints(constraints) {
        disableAutogain(constraints);
        return original.call(this, constraints);
    };
});
console.log("Disable Autogain by Joey Watts!", navigator.mediaDevices.getUserMedia);
