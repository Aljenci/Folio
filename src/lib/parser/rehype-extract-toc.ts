/**
 * TOC data structures and tree-building algorithm.
 *
 * The TocEntry type represents a single heading node in the nested TOC tree.
 * buildTocTree converts a flat array of headings (in document order) into
 * the nested structure using a stack-based algorithm.
 */

export interface TocEntry {
  /** Heading depth: 1 for h1, 2 for h2, etc. */
  depth: number;
  /** Plain-text content of the heading. */
  text: string;
  /** The id attribute added by rehype-slug, used for anchor navigation. */
  id: string;
  /** Headings nested under this one (greater depth). */
  children: TocEntry[];
}

/**
 * Convert a flat array of heading descriptors (in document order) into a
 * nested tree.
 *
 * Algorithm: maintain a stack of [depth, children-array] pairs. For each
 * heading, pop stack entries whose depth is >= the current depth to find
 * the parent, then push the new entry.
 *
 * Example flat input:
 *   [ {depth:1,text:"Title"}, {depth:2,text:"Chapter"}, {depth:3,text:"Section"}, {depth:2,text:"Chapter 2"} ]
 * Result:
 *   Title
 *   └── Chapter
 *       └── Section
 *   └── Chapter 2
 */
export function buildTocTree(
  flat: Array<{ depth: number; text: string; id: string }>,
): TocEntry[] {
  const root: TocEntry[] = [];
  // Each stack entry is [depth, children-array-of-that-node].
  // The initial [0, root] represents the virtual document root.
  const stack: Array<[number, TocEntry[]]> = [[0, root]];

  for (const item of flat) {
    const entry: TocEntry = { ...item, children: [] };

    // Pop entries whose depth is >= current, finding the closest parent.
    while (stack.length > 1 && stack[stack.length - 1][0] >= item.depth) {
      stack.pop();
    }

    stack[stack.length - 1][1].push(entry);
    stack.push([item.depth, entry.children]);
  }

  return root;
}
