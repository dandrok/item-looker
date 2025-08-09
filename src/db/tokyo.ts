import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const auth = process.env.NOTION_TOKEN;
const database_id = process.env.TOKYO_DB_ID;
const notion = new Client({ auth });

interface EnhancedTokyoFlight {
  depart: string;
  return: string;
  price: number | null;
  destination: string;
}

async function getPreviousPriceForFlight(
  flight: EnhancedTokyoFlight
): Promise<number | null> {
  try {
    const response = await notion.databases.query({
      database_id: database_id!,
      filter: {
        and: [
          {
            property: "Destination",
            select: { equals: flight.destination },
          },
          {
            property: "Depart",
            date: {
              equals: new Date(flight.depart).toISOString().split("T")[0],
            },
          },
          {
            property: "Return",
            date: {
              equals: new Date(flight.return).toISOString().split("T")[0],
            },
          },
        ],
      },
      sorts: [{ property: "Checked At", direction: "descending" }],
      page_size: 1,
    });

    if (response.results.length > 0) {
      const page = response.results[0] as any;
      return page.properties?.Price?.number || null;
    }
    return null;
  } catch (error) {
    console.warn("Could not fetch previous price:", error);
    return null;
  }
}

// Helper to calculate if this is a good deal
function calculateDealStatus(
  price: number,
  destination: string
): { isDeal: boolean; dealLevel: string } {
  const thresholds = {
    HND: { excellent: 6750, good: 6814, average: 6900 },
    NRT: { excellent: 6750, good: 6824, average: 6900 },
    KIX: { excellent: 7300, good: 7400, average: 7650 },
  };

  const threshold = thresholds[destination as keyof typeof thresholds];
  if (!threshold) return { isDeal: false, dealLevel: "Unknown" };

  if (price <= threshold.excellent)
    return { isDeal: true, dealLevel: "🔥 Excellent" };
  if (price <= threshold.good)
    return { isDeal: true, dealLevel: "✅ Good Deal" };
  if (price <= threshold.average)
    return { isDeal: false, dealLevel: "📊 Average" };
  return { isDeal: false, dealLevel: "📈 Expensive" };
}

export async function addTokyoFlightToNotion(flight: EnhancedTokyoFlight) {
  if (!flight.price) {
    console.log("❌ Skipping flight with no price");
    return;
  }

  // Get previous price for comparison
  const previousPrice = await getPreviousPriceForFlight(flight);
  const priceChange = previousPrice ? flight.price - previousPrice : null;

  // Calculate trip length
  const departDate = new Date(flight.depart);
  const returnDate = new Date(flight.return);
  const tripLength = Math.round(
    (returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate deal status
  const dealInfo = calculateDealStatus(flight.price, flight.destination);

  // Calculate days until departure
  const today = new Date();
  const daysUntilDeparture = Math.round(
    (departDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate price per day
  const pricePerDay = Math.round(flight.price / tripLength);

  const pageData: any = {
    parent: { database_id },
    properties: {
      "Flight Info": {
        title: [
          {
            text: {
              content: `WAW → ${flight.destination} | ${
                flight.depart.split(" ")[0]
              } ${flight.depart.split(" ")[1]} | ${flight.price} PLN`,
            },
          },
        ],
      },
      Destination: {
        select: { name: flight.destination },
      },
      Depart: {
        date: { start: new Date(flight.depart).toISOString() },
      },
      Return: {
        date: { start: new Date(flight.return).toISOString() },
      },
      Price: {
        number: flight.price,
      },
      "Trip Length": {
        number: tripLength,
      },
      "Price Per Day": {
        number: pricePerDay,
      },
      "Days Until Departure": {
        number: daysUntilDeparture,
      },
      "Deal Status": {
        select: { name: dealInfo.dealLevel },
      },
      "Is Good Deal": {
        checkbox: dealInfo.isDeal,
      },
      ...(priceChange !== null && {
        "Price Change": {
          number: priceChange,
        },
        "Price Trend": {
          select: {
            name:
              priceChange < 0
                ? "📉 Dropped"
                : priceChange > 0
                ? "📈 Increased"
                : "➡️ Same",
          },
        },
        "Previous Price": {
          number: previousPrice,
        },
      }),
      "Checked At": {
        date: { start: new Date().toISOString() },
      },
      "Booking Urgency": {
        select: {
          name:
            daysUntilDeparture < 30
              ? "🚨 Book Soon"
              : daysUntilDeparture < 60
              ? "⚠️ Consider Booking"
              : daysUntilDeparture < 90
              ? "📅 Monitor"
              : "⏰ Too Early",
        },
      },
    },
  };

  try {
    await notion.pages.create(pageData);

    const changeEmoji = priceChange
      ? priceChange < 0
        ? "📉"
        : priceChange > 0
        ? "📈"
        : "➡️"
      : "🆕";
    const changeText = priceChange
      ? ` (${priceChange > 0 ? "+" : ""}${priceChange} PLN)`
      : " (NEW)";
    const dealEmoji = dealInfo.isDeal ? " 🔥" : "";

    console.log(
      `✅ ${changeEmoji} WAW→${flight.destination}: ${flight.price} PLN${changeText}${dealEmoji} | ${tripLength}d trip`
    );
  } catch (error: any) {
    console.error("❌ Failed to add flight to Notion:", error.message);
  }
}
