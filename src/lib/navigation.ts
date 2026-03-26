/**
 * Smoothly scrolls the element with the given id into view.
 * Uses block:"start" for natural reader behaviour. When focus mode is active
 * the scroll container has scroll-padding-top applied via CSS so the heading
 * lands below the top fade band automatically.
 */
export function scrollToHeading(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
