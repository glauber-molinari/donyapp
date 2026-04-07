const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

(async () => {
  const url = process.argv[2] || "http://localhost:3000";
  const outDir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // “DPI”/nitidez: aumenta deviceScaleFactor (2 ou 3 costuma ficar ótimo)
  await page.setViewport({
    width: 1080,
    height: 1350, // formato vertical bom p/ redes sociais
    deviceScaleFactor: 3,
  });

  await page.goto(url, { waitUntil: "networkidle2" });

  // Se tiver fontes/animacoes, isso ajuda a estabilizar
  await page.waitForSelector("main", { timeout: 15000 });

  const file = path.join(outDir, `donyapp-${Date.now()}.png`);
  await page.screenshot({
    path: file,
    fullPage: true, // pega a página toda (tire se quiser só “a dobra”)
  });

  await browser.close();
  console.log("Screenshot salva em:", file);
})();