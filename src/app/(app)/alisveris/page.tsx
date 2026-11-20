import type { Metadata } from "next";
import { ShoppingView } from "./shopping-view";

export const metadata: Metadata = { title: "Alışveriş Listesi" };

export default function Page() {
  return <ShoppingView />;
}
