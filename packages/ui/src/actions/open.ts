import type { IndexEntryMessage } from "tokyo-proto";
import { setFile } from "../App.jsx";

export default async function open(item: IndexEntryMessage) {
  setFile(item);
}
