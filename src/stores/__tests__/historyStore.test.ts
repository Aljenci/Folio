import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "../historyStore";

describe("historyStore", () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [], currentIndex: -1 });
  });

  it("starts empty with currentIndex -1", () => {
    const s = useHistoryStore.getState();
    expect(s.entries).toHaveLength(0);
    expect(s.currentIndex).toBe(-1);
  });

  it("push adds the first entry and sets currentIndex to 0", () => {
    useHistoryStore.getState().push("/docs/a.md");
    const s = useHistoryStore.getState();
    expect(s.entries).toEqual(["/docs/a.md"]);
    expect(s.currentIndex).toBe(0);
  });

  it("push adds multiple entries sequentially", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    useHistoryStore.getState().push("/c.md");
    const s = useHistoryStore.getState();
    expect(s.entries).toEqual(["/a.md", "/b.md", "/c.md"]);
    expect(s.currentIndex).toBe(2);
  });

  it("push discards forward history when navigating from mid-point", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    useHistoryStore.getState().push("/c.md");
    // Go back to /b.md
    useHistoryStore.getState().goBack();
    // Now push a new entry — /c.md should be discarded
    useHistoryStore.getState().push("/d.md");
    const s = useHistoryStore.getState();
    expect(s.entries).toEqual(["/a.md", "/b.md", "/d.md"]);
    expect(s.currentIndex).toBe(2);
  });

  it("canGoBack returns false at start", () => {
    expect(useHistoryStore.getState().canGoBack()).toBe(false);
    useHistoryStore.getState().push("/a.md");
    expect(useHistoryStore.getState().canGoBack()).toBe(false);
  });

  it("canGoBack returns true after pushing two entries", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    expect(useHistoryStore.getState().canGoBack()).toBe(true);
  });

  it("canGoForward returns false when at the last entry", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    expect(useHistoryStore.getState().canGoForward()).toBe(false);
  });

  it("canGoForward returns true after going back", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    useHistoryStore.getState().goBack();
    expect(useHistoryStore.getState().canGoForward()).toBe(true);
  });

  it("goBack returns the previous path", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    const prev = useHistoryStore.getState().goBack();
    expect(prev).toBe("/a.md");
    expect(useHistoryStore.getState().currentIndex).toBe(0);
  });

  it("goBack returns null when already at the start", () => {
    useHistoryStore.getState().push("/a.md");
    expect(useHistoryStore.getState().goBack()).toBeNull();
  });

  it("goForward returns the next path", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    useHistoryStore.getState().goBack();
    const next = useHistoryStore.getState().goForward();
    expect(next).toBe("/b.md");
    expect(useHistoryStore.getState().currentIndex).toBe(1);
  });

  it("goForward returns null when at the end", () => {
    useHistoryStore.getState().push("/a.md");
    expect(useHistoryStore.getState().goForward()).toBeNull();
  });

  it("full navigation round-trip: A → B → C → back → back → forward", () => {
    useHistoryStore.getState().push("/a.md");
    useHistoryStore.getState().push("/b.md");
    useHistoryStore.getState().push("/c.md");

    expect(useHistoryStore.getState().goBack()).toBe("/b.md");
    expect(useHistoryStore.getState().goBack()).toBe("/a.md");
    expect(useHistoryStore.getState().goBack()).toBeNull(); // already at start
    expect(useHistoryStore.getState().goForward()).toBe("/b.md");
  });
});
