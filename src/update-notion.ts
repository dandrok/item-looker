import { Client } from "@notionhq/client";
import ora from "ora";
import dotenv from "dotenv";
dotenv.config();

const auth = process.env.NOTION_TOKEN;
const database_id = process.env.OLX_DB_ID;

const notion = new Client({ auth });

export async function syncToNotion(freshItems: any[]) {
  const spinner = ora("Fetching existing items from Notion...").start();
  const existingHrefs = await getExistingHrefsFromNotion();
  spinner.succeed(`Fetched ${existingHrefs.size} existing items from Notion.`);

  const itemsToInsert = freshItems.filter(
    (item) => !existingHrefs.has(item.href)
  );
  console.log(`🔍 Found ${itemsToInsert.length} new item(s) to insert.`);
  console.log("___________________________________\n");

  const insertSpinner = ora("Inserting new items into Notion...").start();

  for (const item of itemsToInsert) {
    await notion.pages.create({
      parent: { database_id },
      properties: {
        Title: { title: [{ text: { content: item.title } }] },
        Link: { url: item.href },
        Price: { rich_text: [{ text: { content: item.price } }] },
        Location: { rich_text: [{ text: { content: item.location } }] },
        Added: { rich_text: [{ text: { content: item.addedDate } }] },
      },
    });

    insertSpinner.stop(); // optional: move outside the loop
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
      database_id,
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
