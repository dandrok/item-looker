import ora from "ora";
import puppeteer from "puppeteer";
import { addFlightToNotion } from "../db/flights";

const origin = "EIN";
const destination = "KRK";
const passengers = "for 1 adult and 1 child";
const departureDates = [
  "October 15 2025",
  "October 16 2025",
  "October 17 2025",
];
const returnDates = ["October 25 2025", "October 26 2025"];

async function checkPrices() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results: { depart: string; return: string; price: number | null }[] =
    [];

  for (const depart of departureDates) {
    for (const ret of returnDates) {
      // Encode query string with template literal
      const query = encodeURIComponent(
        `flights from ${origin} to ${destination} on ${depart} returning ${ret} ${passengers}`
      );
      const url = `https://www.google.com/travel/flights?hl=en&gl=pl&curr=PLN&q=${query}`;

      const page = await browser.newPage();
      const spinner = ora(`Checking ${depart} → ${ret}...`).start();

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

        try {
          await page.waitForSelector("button", { timeout: 5000 });

          const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const acceptButton = buttons.find(
              (btn) => btn.textContent?.trim().toLowerCase() === "accept all"
            );
            if (acceptButton) {
              (acceptButton as HTMLElement).click();
              return true;
            }
            return false;
          });

          if (clicked) {
            console.log("✅ Clicked 'Accept all' button.");
          } else {
            console.warn("⚠️ 'Accept all' button not found.");
          }
        } catch (err) {
          console.error("❌ Error while handling cookie consent:", err.message);
        }
        // Wait for the new price selector
        await page.waitForSelector(
          'div.YMlIz span[aria-label*="Polish zlotys"]',
          { timeout: 20000 }
        );

        // Extract the price text from the first matching element
        const priceText = await page.$eval(
          'div.YMlIz span[aria-label*="Polish zlotys"]',
          (el) => el.textContent ?? ""
        );

        // Parse number from string like "PLN 968" or "PLN 968"
        const price = parseInt(priceText.replace(/[^\d]/g, ""), 10) || null;

        spinner.succeed(
          `✓ ${depart} → ${ret}: ${price ? price + " PLN" : "Price not found"}`
        );
        results.push({ depart, return: ret, price });
      } catch (err: any) {
        spinner.fail(`✗ ${depart} → ${ret} failed: ${err.message}`);
        results.push({ depart, return: ret, price: null });
      }

      await page.close();
    }
  }

  await browser.close();

  const cheapest = results
    .filter((r) => r.price !== null)
    .sort((a, b) => a.price! - b.price!)[0];

  console.log("\n🔥 Cheapest Option:");
  console.log(cheapest);
  if (cheapest) {
    await addFlightToNotion(cheapest);
  }
}

checkPrices();
