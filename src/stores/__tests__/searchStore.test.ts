import { describe, it, expect, beforeEach } from "vitest";
import { useSearchStore } from "../searchStore";

describe("searchStore", () => {
  beforeEach(() => {
    useSearchStore.setState({
      isOpen: false,
      query: "",
      matchCount: 0,
      currentMatch: -1,
    });
  });

  it("starts with search closed and no query", () => {
    const s = useSearchStore.getState();
    expect(s.isOpen).toBe(false);
    expect(s.query).toBe("");
    expect(s.matchCount).toBe(0);
    expect(s.currentMatch).toBe(-1);
  });

  it("openSearch sets isOpen to true", () => {
    useSearchStore.getState().openSearch();
    expect(useSearchStore.getState().isOpen).toBe(true);
  });

  it("closeSearch resets all fields", () => {
    useSearchStore.getState().openSearch();
    useSearchStore.getState().setQuery("hello");
    useSearchStore.getState().setMatchCount(5);
    useSearchStore.getState().setCurrentMatch(2);

    useSearchStore.getState().closeSearch();
    const s = useSearchStore.getState();
    expect(s.isOpen).toBe(false);
    expect(s.query).toBe("");
    expect(s.matchCount).toBe(0);
    expect(s.currentMatch).toBe(-1);
  });

  it("setQuery updates the query", () => {
    useSearchStore.getState().setQuery("markdown");
    expect(useSearchStore.getState().query).toBe("markdown");
  });

  it("setMatchCount updates the count", () => {
    useSearchStore.getState().setMatchCount(7);
    expect(useSearchStore.getState().matchCount).toBe(7);
  });

  it("setCurrentMatch updates the index", () => {
    useSearchStore.getState().setCurrentMatch(3);
    expect(useSearchStore.getState().currentMatch).toBe(3);
  });

  it("nextMatch advances currentMatch and wraps around", () => {
    useSearchStore.setState({ matchCount: 3, currentMatch: 0 });
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatch).toBe(1);

    useSearchStore.setState({ matchCount: 3, currentMatch: 2 });
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatch).toBe(0); // wraps
  });

  it("prevMatch decrements currentMatch and wraps around", () => {
    useSearchStore.setState({ matchCount: 3, currentMatch: 2 });
    useSearchStore.getState().prevMatch();
    expect(useSearchStore.getState().currentMatch).toBe(1);

    useSearchStore.setState({ matchCount: 3, currentMatch: 0 });
    useSearchStore.getState().prevMatch();
    expect(useSearchStore.getState().currentMatch).toBe(2); // wraps to last
  });

  it("nextMatch does nothing when matchCount is 0", () => {
    useSearchStore.setState({ matchCount: 0, currentMatch: -1 });
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatch).toBe(-1);
  });

  it("prevMatch does nothing when matchCount is 0", () => {
    useSearchStore.setState({ matchCount: 0, currentMatch: -1 });
    useSearchStore.getState().prevMatch();
    expect(useSearchStore.getState().currentMatch).toBe(-1);
  });

  it("nextMatch on a single match always returns index 0", () => {
    useSearchStore.setState({ matchCount: 1, currentMatch: 0 });
    useSearchStore.getState().nextMatch();
    expect(useSearchStore.getState().currentMatch).toBe(0);
  });
});
