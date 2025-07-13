import { Client } from "@notionhq/client";
import fs from "fs/promises";
import ora from "ora";
import path from "path";

const notionToken = "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";
const databaseId = "22f63fff-f2d6-80b4-93f8-ce1dc495aefa";

const notion = new Client({ auth: notionToken });

export async function syncToNotion() {
  const spinner = ora("Reading local OLX data...").start();

  const filePath = path.resolve("olx-data.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const newItems = JSON.parse(fileContent);

  spinner.succeed(`Loaded ${newItems.length} items from olx-data.json`);

  spinner.start("Fetching existing items from Notion...");
  const existingHrefs = await getExistingHrefsFromNotion();
  spinner.succeed(`Fetched ${existingHrefs.size} existing items from Notion.`);

  const itemsToInsert = newItems.filter(
    (item: any) => !existingHrefs.has(item.href)
  );
  console.log(`🔍 Found ${itemsToInsert.length} new item(s) to insert.`);
  console.log("___________________________________\n");

  const insertSpinner = ora("Inserting new items into Notion...").start();

  for (const item of itemsToInsert) {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [{ text: { content: item.title } }],
        },
        Link: {
          url: item.href,
        },
        Price: {
          rich_text: [{ text: { content: item.price } }],
        },
        Location: {
          rich_text: [{ text: { content: item.location } }],
        },
        Added: {
          rich_text: [{ text: { content: item.addedDate } }],
        },
      },
    });

    insertSpinner.stop();

    console.log(`✅ Inserted: ${item.title}`);
  }

  insertSpinner.stop();

  if (itemsToInsert.length === 0) {
    console.log("📭 No new items found. Database is already up to date.");
  } else {
    console.log(
      `📦 Finished inserting ${itemsToInsert.length} new item(s) to Notion.`
    );
  }

  console.log("🚀 Sync to Notion completed.\n");
}

async function getExistingHrefsFromNotion(): Promise<Set<string>> {
  const hrefs = new Set<string>();
  let cursor: string | undefined | null = undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

    for (const page of response.results) {
      const urlProp = (page as any).properties?.Link?.url;
      if (urlProp) hrefs.add(urlProp);
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return hrefs;
}
