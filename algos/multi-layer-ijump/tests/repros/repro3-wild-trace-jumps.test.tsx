import { expect, test } from "bun:test"
import { MultilayerIjump } from "algos/multi-layer-ijump/MultilayerIjump"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { SimpleRouteJson } from "solver-utils"
import { getDebugSvg } from "../../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"

test("repro3: multilayer ijump does not make wild trace jumps when overcoming obstacles", () => {
  // Simplified reproduction of wifi-test-board wild trace jump:
  // Start and goal are aligned horizontally with a blocking obstacle on top layer
  // and an offset conjoined obstacle forcing an orthogonal detour where goal is not
  // in the perpendicular travel direction (wallDistance === Infinity).
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [
      {
        type: "rect",
        layers: ["top", "bottom"],
        center: { x: 0, y: 0 },
        width: 1.4,
        height: 1.8,
        connectedTo: [],
      },
      {
        type: "rect",
        layers: ["top"],
        center: { x: 1.4, y: 0.9 },
        width: 1.2,
        height: 1.2,
        connectedTo: [],
      },
    ],
    connections: [
      {
        name: "conn1",
        pointsToConnect: [
          { x: -3, y: 0, layer: "top" },
          { x: 3, y: 0, layer: "top" },
        ],
      },
    ],
  }

  const autorouter = new MultilayerIjump({
    input,
    isRemovePathLoopsEnabled: true,
    isShortenPathWithShortcutsEnabled: true,
    debug: true,
  })

  const traces = autorouter.solveAndMapToTraces()
  expect(traces).toHaveLength(1)

  // Verify no route point makes a wild jump outside the expected corridor
  for (const pt of traces[0].route) {
    expect(Math.abs(pt.x)).toBeLessThanOrEqual(4.5)
    expect(Math.abs(pt.y)).toBeLessThanOrEqual(3.5)
  }

  expect(
    getDebugSvg({ inputCircuitJson: [], autorouter, solution: traces }),
  ).toMatchSvgSnapshot(import.meta.path)
})
