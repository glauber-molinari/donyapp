/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function openAllowedPage(page, target) {
  switch (target) {
    case "local":
    case "http://localhost:3000":
      await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
      return;
    case "prod":
    case "https://www.donyapp.com":
      await page.goto("https://www.donyapp.com", { waitUntil: "networkidle2" });
      return;
    case "https://donyapp.com":
      await page.goto("https://donyapp.com", { waitUntil: "networkidle2" });
      return;
    default:
      console.error(
        "URL não permitida. Use: local | prod | http://localhost:3000 | https://www.donyapp.com | https://donyapp.com",
      );
      process.exit(1);
  }
}

(async () => {
  const target = process.argv[2] || "local";
  const outDir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1350,
    deviceScaleFactor: 3,
  });

  await openAllowedPage(page, target);

  await page.waitForSelector("main", { timeout: 15000 });

  const file = path.join(outDir, `donyapp-${Date.now()}.png`);
  await page.screenshot({
    path: file,
    fullPage: true,
  });

  await browser.close();
  console.log("Screenshot salva em:", file);
})();
