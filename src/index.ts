// Copyright 2017 David Li

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as ROT from "rot-js";
import * as most from "most";

interface Position {
    x: number,
    y: number,
}

let time = most.periodic(50, "tick");
let keyStream = (function() {
    let stream = most.fromEvent("keydown", document.body)
    .map((e: KeyboardEvent) => {
        return {
            keyCode: e.keyCode,
            state: true,
        };
    })
    .merge(
        most.fromEvent("keyup", document.body)
            .map((e: KeyboardEvent) => {
                return {
                    keyCode: e.keyCode,
                    state: false,
                };
            })
    )
    .multicast();

    return (keyCode: number) => {
        // Pick a specific key
        let keyToggle = stream.filter((e) => e.keyCode == keyCode);
        // Repeat the event every 50 milliseconds
        return time.combine((_: any, keyState) => {
            return keyState;
        }, keyToggle).filter((keyState) => keyState.state);
    };
})();

function keyToDelta(key: number, dx: number, dy: number): most.Stream<Position> {
    return keyStream(key).throttle(200).map(() => ({ x: dx, y: dy }));
}

let mapGen = new ROT.Map.Digger(80, 24);
let map: number[][] = [];
for (let y = 0; y < 24; y++) {
    let row = [];
    for (let x = 0; x < 80; x++) {
        row.push(0);
    }
    map.push(row);
}
mapGen.create((x: number, y: number, value: number) => {
    map[y][x] = value;
});

let player: Position = { x: 0, y: 0 };
for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 80; x++) {
        if (map[y][x] === 0) {
            player.x = x;
            player.y = y;
            break;
        }
    }
}

let movementDeltas = keyToDelta(ROT.VK_UP, 0, -1)
    .merge(keyToDelta(ROT.VK_DOWN, 0, 1))
    .merge(keyToDelta(ROT.VK_LEFT, -1, 0))
    .merge(keyToDelta(ROT.VK_RIGHT, 1, 0));

movementDeltas.observe((delta: Position) => {
    player.x += delta.x;
    player.y += delta.y;
});

const display: any = new ROT.Display({
    width: 80,
    height: 24,
});

document.body.appendChild(display.getContainer());

let render = function() {
    display.clear();

    for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 80; x++) {
            if (map[y][x] > 0) {
                display.draw(x, y, " ", null, "#aaa");
            }
        }
    }

    display.draw(player.x, player.y, "@");
    window.requestAnimationFrame(render);
};

render();
