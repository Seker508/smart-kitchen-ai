import type { Metadata } from "next";
import { InventoryManager } from "./inventory-manager";

export const metadata: Metadata = { title: "Mutfak Envanterim" };

export default function Page() {
  return <InventoryManager />;
}
