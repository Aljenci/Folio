// src/lib/parser/rehype-local-images.ts
import { visit } from 'unist-util-visit';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

interface Options {
  documentPath: string;
}

/**
 * Rehype plugin that rewrites relative (and absolute local) image src paths
 * to Tauri asset protocol URLs so the webview can load them.
 *
 * Remote URLs (http/https) and data URIs are left untouched.
 */
export const rehypeLocalImages: Plugin<[Options], Root> = ({ documentPath }) => {
  return (tree: Root) => {
    // Normalise path separators — Tauri uses forward slashes internally
    const normalised = documentPath.replace(/\\/g, '/');
    const docDir = normalised.split('/').slice(0, -1).join('/');

    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src as string | undefined;
      if (!src) return;

      // Leave remote URLs and data URIs untouched
      if (
        src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('data:')
      ) return;

      const absolutePath = src.startsWith('/')
        ? src
        : `${docDir}/${src}`;

      node.properties!.src = convertFileSrc(absolutePath);
    });
  };
};
