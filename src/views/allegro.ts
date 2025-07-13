import puppeteer from "puppeteer";
import { saveUniqueData } from "../helpers/saveUniqueData";

export async function allegro() {
  const browser = await puppeteer.launch({
    // headless: false, // Uncomment for debugging and to see the browser
    args: ["--use-fake-ui-for-media-stream", "--disable-geolocation"],
  });
  const context = browser.defaultBrowserContext();
  const page = await browser.newPage();

  await context.overridePermissions("https://www.allegrolokalnie.pl", []);

  await page.goto(
    "https://www.olx.pl/elektronika/fotografia/q-ricoh/?search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=2000&search%5Bfilter_float_price:to%5D=4000&search%5Bfilter_enum_state%5D%5B0%5D=used",
    { waitUntil: "networkidle2", timeout: 60000 }
  );

  await page.setViewport({ width: 1080, height: 1024 });

  // Accept cookies if present
  const acceptButton = await page.$("button#onetrust-accept-btn-handler");
  if (acceptButton) {
    await acceptButton.click();
  }

  // Extract data using $$eval (runs in page context)
  const results = await page.$$eval('[data-testid="l-card"]', (cards) =>
    cards.map((card) => {
      const baseUrl = "https://www.olx.pl";

      // ⏹ TITLE & HREF
      const titleAnchor = card.querySelector('[data-cy="ad-card-title"] a');
      const title = titleAnchor?.querySelector("h4")?.innerText.trim() ?? "";
      let href = titleAnchor?.getAttribute("href") ?? "";
      if (href && !href.startsWith("http")) {
        href = baseUrl + href;
      }

      // ⏹ PRICE (exclude nested <span>)
      const priceP = card.querySelector('[data-testid="ad-price"]');
      let price = "";
      if (priceP) {
        price = Array.from(priceP.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim())
          .join(" ");
      }

      // ⏹ LOCATION + ADDED DATE from <p data-testid="location-date">
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

  console.log("scraping is complete");
  console.log("preparing to save data...");
  // Save uniquely
  await saveUniqueData("./olx-data.json", results);

  await browser.close();
}
