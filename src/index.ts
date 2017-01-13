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

interface Delta {
    dx: number,
    dy: number,
}

type Map = number[][];

interface MovementEvent {
    map: Map,
    delta: Delta,
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

function keyToDelta(key: number, dx: number, dy: number): most.Stream<Delta> {
    return keyStream(key).throttle(200).map(() => ({ dx: dx, dy: dy }));
}

let mapGen = new ROT.Map.Digger(80, 24);
let mapArray: number[][] = [];
for (let y = 0; y < 24; y++) {
    let row = [];
    for (let x = 0; x < 80; x++) {
        row.push(0);
    }
    mapArray.push(row);
}
mapGen.create((x: number, y: number, value: number) => {
    mapArray[y][x] = value;
});

let initialPlayerPosition: Position = { x: 0, y: 0 };
for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 80; x++) {
        if (mapArray[y][x] === 0) {
            initialPlayerPosition.x = x;
            initialPlayerPosition.y = y;
            break;
        }
    }
}

let map = most.just(mapArray);
let movementDeltas: most.Stream<Delta> = keyToDelta(ROT.VK_UP, 0, -1)
    .merge(keyToDelta(ROT.VK_DOWN, 0, 1))
    .merge(keyToDelta(ROT.VK_LEFT, -1, 0))
    .merge(keyToDelta(ROT.VK_RIGHT, 1, 0));
let movementEvents = movementDeltas.sample((map: number[][], delta: Delta) => ({
    map: map,
    delta: delta,
}), map, movementDeltas);

let playerPosition: most.Stream<Position> = movementEvents
    .scan((position: Position, event: MovementEvent) => {
        console.log(position, event);
        let newX = position.x + event.delta.dx;
        let newY = position.y + event.delta.dy;

        if (event.map[newY][newX] == 0) {
            position.x = newX;
            position.y = newY;
        }
        return position;
    }, initialPlayerPosition);

const display: any = new ROT.Display({
    width: 80,
    height: 24,
});

document.body.appendChild(display.getContainer());

most.combine((playerPosition: Position, map: number[][]) => {
    display.clear();

    for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 80; x++) {
            if (map[y][x] > 0) {
                display.draw(x, y, " ", null, "#aaa");
            }
        }
    }

    display.draw(playerPosition.x, playerPosition.y, "@");
}, playerPosition, map).observe(() => {});
