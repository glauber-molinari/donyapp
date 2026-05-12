import puppeteer, { KnownDevices } from "puppeteer";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3004";
const OUT_DIR = join(process.cwd(), "scripts", "mobile-screens");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const iphone = KnownDevices["iPhone 13"];
  await page.emulate(iphone);

  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
  });

  const routes = [
    { path: "/", name: "01-landing" },
    { path: "/login", name: "02-login" },
    { path: "/dev-mobile-preview", name: "03-appshell-mobile" },
  ];

  const results = [];

  for (const route of routes) {
    try {
      const resp = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, 800));

      const screenshotPath = join(OUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // For preview, also check key mobile elements
      let mobileChecks = null;
      if (route.path === "/dev-mobile-preview") {
        mobileChecks = await page.evaluate(() => {
          const bottomNav = document.querySelector('[aria-label="Navegação principal mobile"]');
          const bell = document.querySelector('[aria-label^="Notificações"]');
          const kanban = document.querySelector(".snap-x.snap-mandatory");
          const bottomNavRect = bottomNav?.getBoundingClientRect();
          const bellRect = bell?.getBoundingClientRect();
          const body = document.body;
          const html = document.documentElement;
          return {
            bottomNavPresent: !!bottomNav,
            bottomNavBottom: bottomNavRect ? Math.round(bottomNavRect.bottom) : null,
            bottomNavLeft: bottomNavRect ? Math.round(bottomNavRect.left) : null,
            bottomNavHeight: bottomNavRect ? Math.round(bottomNavRect.height) : null,
            bellPresent: !!bell,
            bellSize: bellRect ? { w: Math.round(bellRect.width), h: Math.round(bellRect.height) } : null,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollY: window.scrollY,
            bodyOverflowX: getComputedStyle(body).overflowX,
            htmlOverflowX: getComputedStyle(html).overflowX,
            bodyScrollWidth: body.scrollWidth,
            bodyClientWidth: body.clientWidth,
            kanbanSnapPresent: !!kanban,
            kanbanScrollWidth: kanban ? kanban.scrollWidth : null,
            kanbanClientWidth: kanban ? kanban.clientWidth : null,
          };
        });

        // Scroll the kanban horizontally and verify bottom nav stays anchored
        const afterKanbanScroll = await page.evaluate(async () => {
          const kanban = document.querySelector(".snap-x.snap-mandatory");
          if (!kanban) return null;
          kanban.scrollLeft = 500;
          await new Promise((r) => setTimeout(r, 400));
          const bottomNav = document.querySelector('[aria-label="Navegação principal mobile"]');
          const rect = bottomNav?.getBoundingClientRect();
          return {
            kanbanScrollLeft: kanban.scrollLeft,
            bottomNavLeftAfterScroll: rect ? Math.round(rect.left) : null,
            bottomNavBottomAfterScroll: rect ? Math.round(rect.bottom) : null,
            windowScrollX: window.scrollX,
          };
        });

        mobileChecks.afterKanbanScroll = afterKanbanScroll;

        // Take a second screenshot after horizontal scroll to visually verify
        const screenshotAfterPath = screenshotPath.replace(".png", "-after-scroll.png");
        await page.screenshot({ path: screenshotAfterPath, fullPage: false });
        mobileChecks.screenshotAfterScroll = screenshotAfterPath;
      }

      results.push({
        route: route.path,
        status: resp?.status() ?? "unknown",
        url: page.url(),
        screenshot: screenshotPath,
        ...(mobileChecks ? { mobileChecks } : {}),
      });
    } catch (err) {
      results.push({ route: route.path, error: String(err) });
    }
  }

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  const metaData = await page.evaluate(() => {
    const get = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
    const getHref = (sel) => document.querySelector(sel)?.getAttribute("href") ?? null;
    return {
      manifestHref: getHref('link[rel="manifest"]'),
      viewportContent: get('meta[name="viewport"]'),
      themeColor: get('meta[name="theme-color"]'),
      appleCapable: get('meta[name="apple-mobile-web-app-capable"]'),
      appleTitle: get('meta[name="apple-mobile-web-app-title"]'),
      appleIcon: getHref('link[rel="apple-touch-icon"]'),
    };
  });

  await browser.close();

  console.log("\n=== Mobile Test Results ===\n");
  console.log("Routes tested:");
  for (const r of results) {
    console.log(JSON.stringify(r, null, 2));
  }
  console.log("\nMeta tags on landing:");
  console.log(JSON.stringify(metaData, null, 2));
  console.log("\nConsole/page errors:");
  if (consoleErrors.length === 0) {
    console.log("  none ok");
  } else {
    consoleErrors.forEach((e) => console.log("  - " + e));
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
