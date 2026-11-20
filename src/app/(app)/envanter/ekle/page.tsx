import type { Metadata } from "next";
import { AddIngredientForm } from "./add-form";

export const metadata: Metadata = { title: "Malzeme Ekle" };

export default function Page() {
  return <AddIngredientForm />;
}
