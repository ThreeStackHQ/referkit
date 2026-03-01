import type { Config } from "tailwindcss";
export default { darkMode:"class", content:["./src/**/*.{ts,tsx}"],
  theme:{ extend:{ colors:{ primary:{ DEFAULT:"#22c55e", foreground:"#000" } } } }, plugins:[] } satisfies Config;
