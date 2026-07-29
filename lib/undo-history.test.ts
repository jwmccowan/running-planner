import { describe, expect, it } from "vitest";
import { init, push, undo, redo, canUndo, canRedo, MAX_HISTORY } from "./undo-history";

describe("undo-history", () => {
  it("initializes with given value", () => {
    const h = init("a");
    expect(h.present).toBe("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("push adds to history and clears future", () => {
    let h = init("a");
    h = push(h, "b");
    expect(h.present).toBe("b");
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it("undo restores previous state", () => {
    let h = init("a");
    h = push(h, "b");
    h = undo(h);
    expect(h.present).toBe("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(true);
  });

  it("redo restores undone state", () => {
    let h = init("a");
    h = push(h, "b");
    h = undo(h);
    h = redo(h);
    expect(h.present).toBe("b");
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it("push after undo clears future", () => {
    let h = init("a");
    h = push(h, "b");
    h = push(h, "c");
    h = undo(h);
    h = push(h, "d");
    expect(h.present).toBe("d");
    expect(canRedo(h)).toBe(false);
    // past is [a, b]
    h = undo(h);
    expect(h.present).toBe("b");
  });

  it("supports updater function", () => {
    let h = init([1]);
    h = push(h, (prev) => [...prev, 2]);
    expect(h.present).toEqual([1, 2]);
    expect(canUndo(h)).toBe(true);
  });

  it("undo on empty past is a no-op", () => {
    const h = init("a");
    const h2 = undo(h);
    expect(h2).toBe(h);
  });

  it("redo on empty future is a no-op", () => {
    const h = init("a");
    const h2 = redo(h);
    expect(h2).toBe(h);
  });

  it("handles multiple undo/redo steps", () => {
    let h = init(0);
    h = push(h, 1);
    h = push(h, 2);
    h = push(h, 3);

    h = undo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    h = undo(h);
    expect(h.present).toBe(0);
    expect(canUndo(h)).toBe(false);

    h = redo(h);
    expect(h.present).toBe(1);
    h = redo(h);
    expect(h.present).toBe(2);
    h = redo(h);
    expect(h.present).toBe(3);
    expect(canRedo(h)).toBe(false);
  });

  it("preserves reference identity through undo/redo", () => {
    const original = [1, 2, 3];
    let h = init(original);
    h = push(h, [4, 5]);
    h = undo(h);
    expect(h.present).toBe(original);
  });

  it("caps past at MAX_HISTORY entries", () => {
    let h = init(0);
    for (let i = 1; i <= MAX_HISTORY + 10; i++) {
      h = push(h, i);
    }
    expect(h.past.length).toBe(MAX_HISTORY);
    expect(h.present).toBe(MAX_HISTORY + 10);
    // oldest entries were dropped — can only undo MAX_HISTORY times
    for (let i = 0; i < MAX_HISTORY; i++) {
      h = undo(h);
    }
    expect(canUndo(h)).toBe(false);
    expect(h.present).toBe(10);
  });
});
