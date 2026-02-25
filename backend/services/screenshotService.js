const puppeteer = require("puppeteer");

async function getScreenshot(domain) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true
  });

  try {
    const page = await browser.newPage();

    await page.goto(`https://${domain}`, {
      waitUntil: "networkidle2",
      timeout: 20000
    });

    const screenshotBuffer = await page.screenshot({
      fullPage: true
    });

    await browser.close();

    return screenshotBuffer.toString("base64");

  } catch (err) {
    await browser.close();
    console.error("Screenshot error:", err.message);
    return null;
  }
}

module.exports = { getScreenshot };
