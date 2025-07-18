import { syncToNotion } from "./update-notion";
import { olx } from "./views/olx";

const main = async () => {
  try {
    const freshItems = await olx(); // scrape items
    await syncToNotion(freshItems); // sync with Notion
  } catch (error) {
    console.error("Error in main execution:", error);
  }
};

main().catch(console.error);
