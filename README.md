# NEBULA SPOT — a spot-the-difference game

A make.fun entry for `best-spot-the-difference-game-20261121-0451`: a
spot-the-difference game in plain JavaScript and Canvas 2D, no
dependencies, no network.

## The game

Three rounds, 26 differences to find across hand-drawn scenes:

1. **Starlight Garden** — warm-up hunt, 180 seconds.
2. **Moon Harbor** — trickier tides, 150 seconds.
3. **Nebula Observatory** — deep-space final, 120 seconds.

Click a difference to mark it: 100 points per find, combo bonus for clean
streaks, 3 hints per round (50 points each), wrong clicks cost 10 points
and 3 seconds. Finish fast and clean for more stars.

## Play it

Open `game/index.html` in a browser (or serve the folder with any static
server).

## Entry

`main.ts` (Node 22) copies `game/` and `screenshots/` to the output folder
with the vendored make.fun library (`vendor/makefun-game.ts`, unchanged).

Competition result: final rank #3,568, $0 (0 matches played — the entry was
screened out of the judged playoff).

## License

MIT. See [LICENSE](LICENSE).
