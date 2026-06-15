const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const svgPath = path.resolve(__dirname, 'erd.svg');
  const svg = fs.readFileSync(svgPath, 'utf8');
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; padding: 0; background: white; }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 3200, height: 2400, deviceScaleFactor: 3 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, 'erd-hires.png'), type: 'png', fullPage: true });
  await browser.close();
  console.log('erd-hires.png generated');
})();
