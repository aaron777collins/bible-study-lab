import { describe, expect, it } from "vitest";
import { buildGraph, findPaths, sharedNeighbours } from "@/lib/xref/graph";

const g = (edges: [number, number, number][], nodes = 20) => buildGraph(edges.flat(), nodes);
const ids = (p: { id: number }[]) => p.map((s) => s.id);

describe("path finding", () => {
  it("finds the fewest steps", () => {
    const graph = g([[0, 1, 10], [1, 2, 10], [2, 3, 10], [0, 3, 10]]);
    const r = findPaths(graph, 0, 3, 5);
    expect(r.steps).toBe(1);
    expect(ids(r.paths[0])).toEqual([0, 3]);
  });

  it("chooses the widest of the equally short routes", () => {
    // 0-1-3 has a weak link (5), 0-2-3 is strong (30 and 40)
    const graph = g([[0, 1, 90], [1, 3, 5], [0, 2, 30], [2, 3, 40]]);
    const r = findPaths(graph, 0, 3, 5);
    expect(r.steps).toBe(2);
    expect(ids(r.paths[0])).toEqual([0, 2, 3]);
    expect(r.paths[0].map((s) => s.votes)).toEqual([0, 30, 40]);
    // the other route is offered as an alternative
    expect(r.paths.map(ids)).toContainEqual([0, 1, 3]);
  });

  it("treats links as undirected", () => {
    const graph = g([[5, 4, 12], [4, 3, 12]]);
    expect(ids(findPaths(graph, 3, 5, 5).paths[0])).toEqual([3, 4, 5]);
  });

  it("reports unreachable verses", () => {
    const graph = g([[0, 1, 10], [5, 6, 10]]);
    const r = findPaths(graph, 0, 6, 5);
    expect(r.steps).toBe(-1);
    expect(r.paths).toEqual([]);
  });

  it("respects the step cap", () => {
    const chain = Array.from({ length: 10 }, (_, i) => [i, i + 1, 10] as [number, number, number]);
    const graph = g(chain, 12);
    expect(findPaths(graph, 0, 9, 5, 8).steps).toBe(-1);
    expect(findPaths(graph, 0, 8, 5, 8).steps).toBe(8);
  });

  it("raising the threshold can remove the path", () => {
    const graph = g([[0, 1, 10], [1, 2, 30]]);
    expect(findPaths(graph, 0, 2, 10).steps).toBe(2);
    expect(findPaths(graph, 0, 2, 20).steps).toBe(-1);
  });

  it("breaks ties by verse order, so results are stable", () => {
    const graph = g([[0, 1, 10], [1, 3, 10], [0, 2, 10], [2, 3, 10]]);
    const a = findPaths(graph, 0, 3, 5);
    const b = findPaths(graph, 0, 3, 5);
    expect(ids(a.paths[0])).toEqual([0, 1, 3]);
    expect(a).toEqual(b);
  });

  it("handles the same verse and keeps the highest vote for duplicate edges", () => {
    const graph = g([[0, 1, 5], [1, 0, 50]]);
    expect(findPaths(graph, 0, 0, 5).steps).toBe(0);
    expect(findPaths(graph, 0, 1, 5).paths[0][1].votes).toBe(50);
  });

  it("lists verses linked to both ends", () => {
    const graph = g([[0, 5, 10], [5, 9, 20], [0, 6, 10], [6, 9, 5], [0, 7, 10]]);
    expect(sharedNeighbours(graph, 0, 9, 5)).toEqual([{ id: 5, votes: 10 }, { id: 6, votes: 5 }]);
    expect(findPaths(graph, 0, 9, 5).shared.map((s) => s.id)).toEqual([5, 6]);
  });
});
