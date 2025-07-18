// olx.ts
import puppeteer from "puppeteer";
import ora from "ora";

export async function olx() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      "--disable-geolocation",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://www.olx.pl", []);

  const page = await browser.newPage();
  await page.goto(
    "https://www.olx.pl/elektronika/fotografia/q-ricoh/?search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=2000&search%5Bfilter_float_price:to%5D=4000&search%5Bfilter_enum_state%5D%5B0%5D=used",
    { waitUntil: "networkidle2", timeout: 60000 }
  );

  const scrapingSpinner = ora("Scraping OLX...").start();

  const acceptButton = await page.$("button#onetrust-accept-btn-handler");
  if (acceptButton) await acceptButton.click();

  const results = await page.$$eval('[data-testid="l-card"]', (cards) =>
    cards.map((card) => {
      const baseUrl = "https://www.olx.pl";

      const titleAnchor = card.querySelector('[data-cy="ad-card-title"] a');
      const title = titleAnchor?.querySelector("h4")?.innerText.trim() ?? "";
      let href = titleAnchor?.getAttribute("href") ?? "";
      if (href && !href.startsWith("http")) {
        href = baseUrl + href;
      }

      const priceP = card.querySelector('[data-testid="ad-price"]');
      let price = "";
      if (priceP) {
        price = Array.from(priceP.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim())
          .join(" ");
      }

      const locationDateP = card.querySelector(
        'p[data-testid="location-date"]'
      );
      let location = "";
      let addedDate = "";
      if (locationDateP) {
        const text = locationDateP.textContent ?? "";
        const [loc, date] = text.split(" - ");
        location = loc?.trim() ?? "";
        addedDate = date?.trim() ?? "";
      }

      return { title, href, price, location, addedDate };
    })
  );

  await browser.close();
  scrapingSpinner.succeed(
    `Scraping OLX - done. Found ${results.length} items.`
  );
  return results;
}
