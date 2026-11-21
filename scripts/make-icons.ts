/** Renders public/icon.svg to the PNG icons the manifest needs. Run once: npx tsx scripts/make-icons.ts */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { ROOT } from "./lib.ts";

const pub = path.join(ROOT, "public");
const render = async (svgFile: string, size: number, out: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const svg = fs.readFileSync(path.join(pub, svgFile), "utf8");
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: path.join(pub, out), omitBackground: true });
  await browser.close();
};
await render("icon.svg", 192, "icon-192.png");
await render("icon.svg", 512, "icon-512.png");
await render("icon-maskable.svg", 512, "icon-maskable-512.png");
await render("icon.svg", 180, "apple-touch-icon.png");
console.log("icons written");
