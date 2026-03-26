import { create } from "zustand";
import type { ParseResult } from "../lib/parser";

interface DocumentState {
  filePath: string | null;
  fileName: string | null;
  rawContent: string | null;
  parsedResult: ParseResult | null;
  isLoading: boolean;
  error: string | null;

  setDocument: (
    filePath: string,
    fileName: string,
    rawContent: string,
    parsedResult: ParseResult,
  ) => void;
  /** Update only the parsed result (used by the file watcher on external saves). */
  updateDocument: (parsedResult: ParseResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearDocument: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  filePath: null,
  fileName: null,
  rawContent: null,
  parsedResult: null,
  isLoading: false,
  error: null,

  setDocument: (filePath, fileName, rawContent, parsedResult) =>
    set({ filePath, fileName, rawContent, parsedResult, error: null, isLoading: false }),

  updateDocument: (parsedResult) =>
    set({ parsedResult, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearDocument: () =>
    set({ filePath: null, fileName: null, rawContent: null, parsedResult: null, error: null }),
}));
