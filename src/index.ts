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

let player: Position = { x: 0, y: 0 };

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
    display.draw(player.x, player.y, "@");
    window.requestAnimationFrame(render);
};

render();
