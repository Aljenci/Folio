import { describe, it, expect, beforeEach } from "vitest";
import { useRecentFilesStore } from "../recentFilesStore";

describe("recentFilesStore — in-memory logic", () => {
  beforeEach(() => {
    useRecentFilesStore.setState({ files: [], isLoaded: false });
  });

  it("starts with an empty list and isLoaded false", () => {
    const s = useRecentFilesStore.getState();
    expect(s.files).toHaveLength(0);
    expect(s.isLoaded).toBe(false);
  });

  it("add inserts a new file entry at the front", async () => {
    await useRecentFilesStore.getState().add("/docs/readme.md");
    const { files } = useRecentFilesStore.getState();
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("/docs/readme.md");
    expect(files[0].name).toBe("readme.md");
    expect(typeof files[0].openedAt).toBe("number");
  });

  it("add extracts the filename from the full path (forward slash)", async () => {
    await useRecentFilesStore.getState().add("/home/user/notes/my-doc.md");
    expect(useRecentFilesStore.getState().files[0].name).toBe("my-doc.md");
  });

  it("add extracts the filename from a Windows path (backslash)", async () => {
    await useRecentFilesStore.getState().add("C:\\Users\\user\\docs\\notes.md");
    expect(useRecentFilesStore.getState().files[0].name).toBe("notes.md");
  });

  it("add prepends so the most recently opened file is first", async () => {
    await useRecentFilesStore.getState().add("/a.md");
    await useRecentFilesStore.getState().add("/b.md");
    await useRecentFilesStore.getState().add("/c.md");
    const paths = useRecentFilesStore.getState().files.map((f) => f.path);
    expect(paths).toEqual(["/c.md", "/b.md", "/a.md"]);
  });

  it("add deduplicates by path — re-adding moves entry to front", async () => {
    await useRecentFilesStore.getState().add("/a.md");
    await useRecentFilesStore.getState().add("/b.md");
    await useRecentFilesStore.getState().add("/a.md"); // re-add /a.md
    const { files } = useRecentFilesStore.getState();
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("/a.md");
    expect(files[1].path).toBe("/b.md");
  });

  it("add caps the list at 20 entries (FIFO eviction)", async () => {
    for (let i = 1; i <= 22; i++) {
      await useRecentFilesStore.getState().add(`/file-${i}.md`);
    }
    const { files } = useRecentFilesStore.getState();
    expect(files).toHaveLength(20);
    // Oldest entries (file-1 and file-2) should be evicted
    const paths = files.map((f) => f.path);
    expect(paths).not.toContain("/file-1.md");
    expect(paths).not.toContain("/file-2.md");
    expect(paths[0]).toBe("/file-22.md");
  });

  it("remove deletes the entry by path", async () => {
    await useRecentFilesStore.getState().add("/a.md");
    await useRecentFilesStore.getState().add("/b.md");
    await useRecentFilesStore.getState().remove("/a.md");
    const { files } = useRecentFilesStore.getState();
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("/b.md");
  });

  it("remove is a no-op for a path that does not exist", async () => {
    await useRecentFilesStore.getState().add("/a.md");
    await useRecentFilesStore.getState().remove("/nonexistent.md");
    expect(useRecentFilesStore.getState().files).toHaveLength(1);
  });

  it("clear empties the list", async () => {
    await useRecentFilesStore.getState().add("/a.md");
    await useRecentFilesStore.getState().add("/b.md");
    await useRecentFilesStore.getState().clear();
    expect(useRecentFilesStore.getState().files).toHaveLength(0);
  });
});
