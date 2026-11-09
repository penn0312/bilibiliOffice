/** Original inline artwork; no remote avatar or icon services. */
const paths: Record<string, string> = {
  chat: "M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5Z",
  bot: "M8 5h8l4 4v10H4V9l4-4Zm4 0V2M8 12h.01M16 12h.01M8 16h8",
  hash: "M9 3 7 21M17 3l-2 18M3 8h18M2 16h18",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  doc: "M5 2h10l4 4v16H5V2Zm10 0v5h4M8 12h8M8 16h8",
  calendar: "M4 5h16v16H4V5Zm3-3v6M17 2v6M4 10h16M8 14h2M14 14h2M8 18h2",
  check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM7 12l3 3 7-7",
  meeting: "M3 4h18v16H3V4Zm3 12 4-4 3 3 5-6M8 8h.01",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  users:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 1a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-4",
  drive: "m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10",
  upgrade: "m3 5 9 16 9-16h-6l-3 5-3-5H3Z",
  unread: "M18 3h3v3M21 10v11H3V3h11",
  at: "M16 8v7c0 3 6 2 6-4a10 10 0 1 0-4 9M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  user: "M20 21H4v-2c0-4 5-3 5-7a5 5 0 1 1 6 0c0 4 5 3 5 7v2Z",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  plus: "M12 3v18M3 12h18",
  smile:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM8 9h.01M16 9h.01M7 14c2 5 8 5 10 0",
  image: "M3 3h18v18H3V3Zm0 14 6-6 5 5 3-3 4 4M15 7h.01",
  folder: "M2 6h8l2 3h10v12H2V6Zm0 0V3h8l2 3h8v3",
  phone: "M5 2 2 5c0 9 8 17 17 17l3-3-5-5-3 3-7-7 3-3-5-5Z",
  list: "M3 4h5v5H3V4Zm10 0h8M13 8h8M3 15h5v5H3v-5Zm10 0h8M13 19h8",
  quote: "M3 4h18v14H9l-6 4V4Zm4 5h10M7 13h7",
  more: "M4 12h.01M12 12h.01M20 12h.01",
  settings:
    "M9 3h6l1 4 4 1 1 6-4 2-1 5h-6l-2-4-5-1V9l4-2 2-4Zm7 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  back: "M9 5 2 12l7 7M2 12h20",
  bolt: "m14 1-11 13h8l-1 9L22 9h-9l1-8Z",
  pin: "m8 3 12 5-4 3-2 6-4-4-5-1 4-3-1-6Zm2 10-7 8",
  mute: "M5 9a7 7 0 0 1 11-6M19 9v5l2 3H9M9 21h6M2 2l20 20",
};
export function wecomIcon(name: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "wc-icon");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[name] || paths.doc);
  svg.append(path);
  return svg;
}
export function wecomAvatar(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const colors = [
    ["#b9d9e3", "#60947b", "#385e58"],
    ["#e8d3b8", "#bc9172", "#6d665c"],
    ["#bacbe0", "#8695b9", "#4e6588"],
    ["#d6debc", "#9dad78", "#637658"],
    ["#d8c8d6", "#ad92ad", "#765c79"],
  ][hash % 5];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 40 40");
  svg.setAttribute("aria-hidden", "true");
  const parts = [
    ["rect", { width: "40", height: "40", fill: colors[0] }],
    [
      "circle",
      { cx: String(7 + ((hash >>> 8) % 25)), cy: "10", r: "5", fill: "#fff9" },
    ],
    [
      "path",
      {
        d: `M0 30 12 ${9 + ((hash >>> 12) % 14)} 28 32 40 18V40H0Z`,
        fill: colors[1],
      },
    ],
    ["path", { d: "M0 35 24 22 40 32V40H0Z", fill: colors[2] }],
  ] as const;
  for (const [tag, attributes] of parts) {
    const part = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries(attributes))
      part.setAttribute(key, value);
    svg.append(part);
  }
  return svg;
}
