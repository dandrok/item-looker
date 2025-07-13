import { syncToNotion } from "./update-notion";
import { olx } from "./views/olx";

const main = async () => {
  try {
    await olx();
    await syncToNotion();
  } catch (error) {
    console.error("Error in main execution:", error);
  }
};

main().catch(console.error);
