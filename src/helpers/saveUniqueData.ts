import fs from "fs/promises";
import ora from "ora";

export type OlxItem = {
  title: string;
  href: string;
  price: string;
  location: string;
  addedDate: string;
};

export async function saveUniqueData(filePath: string, newData: OlxItem[]) {
  const spinner = ora("Saving unique OLX data...").start();

  try {
    let existingData: OlxItem[] = [];

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      existingData = JSON.parse(fileContent);
    } catch (e) {
      if ((e as any).code !== "ENOENT") throw e;
    }

    const existingHrefs = new Set(existingData.map((item) => item.href));
    const uniqueNewData = newData.filter(
      (item) => !existingHrefs.has(item.href)
    );

    if (uniqueNewData.length === 0) {
      spinner.info("No new unique entries to add.");
      return;
    }

    const combined = [...existingData, ...uniqueNewData];
    await fs.writeFile(filePath, JSON.stringify(combined, null, 2), "utf-8");

    spinner.succeed(`${uniqueNewData.length} new entries added.`);
  } catch (err) {
    spinner.fail("Failed to save unique data.");
    throw err;
  }
}
