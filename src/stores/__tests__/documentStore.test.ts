import { describe, it, expect, beforeEach } from "vitest";
import { useDocumentStore } from "../documentStore";
import type { ParseResult } from "../../lib/parser";

const mockResult: ParseResult = {
  html: "<h1>Test</h1>",
  frontMatter: { title: "Test" },
  headings: [{ id: "test", text: "Test", level: 1 }],
  toc: [],
};

const mockResult2: ParseResult = {
  html: "<h2>Updated</h2>",
  frontMatter: {},
  headings: [{ id: "updated", text: "Updated", level: 2 }],
  toc: [],
};

describe("documentStore", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      filePath: null,
      fileName: null,
      rawContent: null,
      parsedResult: null,
      isLoading: false,
      error: null,
    });
  });

  it("starts with all fields null/false", () => {
    const s = useDocumentStore.getState();
    expect(s.filePath).toBeNull();
    expect(s.fileName).toBeNull();
    expect(s.rawContent).toBeNull();
    expect(s.parsedResult).toBeNull();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("setDocument populates all document fields and clears error", () => {
    useDocumentStore.getState().setError("previous error");
    useDocumentStore.getState().setDocument("/path/to/file.md", "file.md", "# Test", mockResult);

    const s = useDocumentStore.getState();
    expect(s.filePath).toBe("/path/to/file.md");
    expect(s.fileName).toBe("file.md");
    expect(s.rawContent).toBe("# Test");
    expect(s.parsedResult).toBe(mockResult);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it("updateDocument replaces parsedResult and clears error", () => {
    useDocumentStore.getState().setDocument("/path/file.md", "file.md", "# Test", mockResult);
    useDocumentStore.getState().updateDocument(mockResult2);

    const s = useDocumentStore.getState();
    expect(s.parsedResult).toBe(mockResult2);
    expect(s.error).toBeNull();
    // Other fields are untouched
    expect(s.filePath).toBe("/path/file.md");
  });

  it("setLoading sets the isLoading flag", () => {
    useDocumentStore.getState().setLoading(true);
    expect(useDocumentStore.getState().isLoading).toBe(true);

    useDocumentStore.getState().setLoading(false);
    expect(useDocumentStore.getState().isLoading).toBe(false);
  });

  it("setError stores the error message and clears isLoading", () => {
    useDocumentStore.getState().setLoading(true);
    useDocumentStore.getState().setError("Something went wrong");

    const s = useDocumentStore.getState();
    expect(s.error).toBe("Something went wrong");
    expect(s.isLoading).toBe(false);
  });

  it("setError(null) clears the error", () => {
    useDocumentStore.getState().setError("err");
    useDocumentStore.getState().setError(null);
    expect(useDocumentStore.getState().error).toBeNull();
  });

  it("clearDocument resets all fields to null", () => {
    useDocumentStore.getState().setDocument("/path/file.md", "file.md", "# Test", mockResult);
    useDocumentStore.getState().clearDocument();

    const s = useDocumentStore.getState();
    expect(s.filePath).toBeNull();
    expect(s.fileName).toBeNull();
    expect(s.rawContent).toBeNull();
    expect(s.parsedResult).toBeNull();
    expect(s.error).toBeNull();
  });
});
