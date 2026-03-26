// src/lib/fonts.ts

export type FontChoice = 'lora' | 'source-serif-4' | 'inter' | 'jetbrains-mono';

const FONT_STACKS: Record<FontChoice, string> = {
  'lora':           "'Lora Variable', Georgia, 'Times New Roman', serif",
  'source-serif-4': "'Source Serif 4 Variable', Georgia, serif",
  'inter':          "'Inter Variable', system-ui, -apple-system, sans-serif",
  'jetbrains-mono': "'JetBrains Mono Variable', ui-monospace, monospace",
};

/** Apply a body font choice by updating the --font-body CSS custom property. */
export function applyFont(choice: FontChoice): void {
  document.documentElement.style.setProperty('--font-body', FONT_STACKS[choice]);
}
