// Smart Kitchen AI — PostgreSQL veritabanı şeması (Drizzle ORM)
import { relations, sql } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, real, serial, smallint,
  text, timestamp, uniqueIndex, varchar,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const unitEnum = pgEnum("unit", [
  "ADET", "GRAM", "KILOGRAM", "MILILITRE", "LITRE", "YEMEK_KASIGI", "TATLI_KASIGI", "CAY_KASIGI",
  "SU_BARDAGI", "CAY_BARDAGI", "PAKET", "DEMET", "DIS", "TUTAM", "DILIM",
]);
export const storageEnum = pgEnum("storage_area", ["BUZDOLABI", "DONDURUCU", "MUTFAK_DOLABI", "DIGER"]);
export const difficultyEnum = pgEnum("difficulty", ["KOLAY", "ORTA", "ZOR"]);
export const sourceEnum = pgEnum("ingredient_source", ["MANUAL", "IMAGE", "SHOPPING"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["PROCESSING", "COMPLETED", "FAILED", "CONFIRMED"]);
export const chatRoleEnum = pgEnum("chat_role", ["USER", "ASSISTANT"]);

// ---------- Kullanıcılar ----------
export const users = pgTable("users", {
  id: id(),
  firstName: varchar("first_name", { length: 60 }).notNull(),
  lastName: varchar("last_name", { length: 60 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // Şifre değiştiğinde artırılır; eski oturum çerezlerini geçersiz kılar.
  tokenVersion: integer("token_version").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("prt_user_idx").on(t.userId)]);

export const userPreferences = pgTable("user_preferences", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  vegetarian: boolean("vegetarian").notNull().default(false),
  vegan: boolean("vegan").notNull().default(false),
  glutenFree: boolean("gluten_free").notNull().default(false),
  lactoseFree: boolean("lactose_free").notNull().default(false),
  lowBudget: boolean("low_budget").notNull().default(false),
  quickMeals: boolean("quick_meals").notNull().default(false),
  healthy: boolean("healthy").notNull().default(false),
  allergens: text("allergens").array().notNull().default(sql`'{}'::text[]`),
  allergyNotes: varchar("allergy_notes", { length: 500 }),
  updatedAt: updatedAt(),
});

// ---------- Malzeme kataloğu ----------
export const ingredientCategories = pgTable("ingredient_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  categoryId: integer("category_id").notNull().references(() => ingredientCategories.id),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  allergens: text("allergens").array().notNull().default(sql`'{}'::text[]`),
  defaultUnit: unitEnum("default_unit").notNull().default("ADET"),
  // Yaklaşık maliyet seviyesi: 1 ucuz, 2 orta, 3 pahalı
  costLevel: smallint("cost_level").notNull().default(1),
  isMeat: boolean("is_meat").notNull().default(false),
  isAnimalProduct: boolean("is_animal_product").notNull().default(false),
  alwaysAvailable: boolean("always_available").notNull().default(false),
  // 1 adet ≈ kaç gram (birim dönüşümü için, varsa)
  gramsPerPiece: numeric("grams_per_piece", { precision: 10, scale: 2 }),
}, (t) => [index("ingredients_category_idx").on(t.categoryId)]);

export const userIngredients = pgTable("user_ingredients", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  name: varchar("name", { length: 80 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => ingredientCategories.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: unitEnum("unit").notNull(),
  storage: storageEnum("storage").notNull().default("BUZDOLABI"),
  expiresAt: date("expires_at", { mode: "string" }),
  note: varchar("note", { length: 300 }),
  source: sourceEnum("source").notNull().default("MANUAL"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  index("ui_user_idx").on(t.userId),
  index("ui_user_exp_idx").on(t.userId, t.expiresAt),
  index("ui_user_ing_idx").on(t.userId, t.ingredientId),
]);

// ---------- Tarifler ----------
export const recipeCategories = pgTable("recipe_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  // Vejetaryen / Pratik gibi kategoriler tarif özelliklerinden türetilir
  isVirtual: boolean("is_virtual").notNull().default(false),
  sortOrder: smallint("sort_order").notNull().default(0),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: varchar("description", { length: 600 }).notNull(),
  imageUrl: varchar("image_url", { length: 300 }),
  emoji: varchar("emoji", { length: 16 }).notNull().default("🍽️"),
  categoryId: integer("category_id").notNull().references(() => recipeCategories.id),
  prepMinutes: smallint("prep_minutes").notNull(),
  cookMinutes: smallint("cook_minutes").notNull(),
  totalMinutes: smallint("total_minutes").notNull(),
  servings: smallint("servings").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  isVegetarian: boolean("is_vegetarian").notNull().default(false),
  isVegan: boolean("is_vegan").notNull().default(false),
  isGlutenFree: boolean("is_gluten_free").notNull().default(false),
  isLactoseFree: boolean("is_lactose_free").notNull().default(false),
  costLevel: numeric("cost_level", { precision: 4, scale: 2 }).notNull(),
  allergens: text("allergens").array().notNull().default(sql`'{}'::text[]`),
  // Besin değerleri yalnızca güvenilir kaynak varsa doldurulur.
  nutrition: jsonb("nutrition"),
  createdAt: createdAt(),
}, (t) => [index("recipes_category_idx").on(t.categoryId), index("recipes_total_idx").on(t.totalMinutes)]);

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: unitEnum("unit"),
  note: varchar("note", { length: 80 }),
  isOptional: boolean("is_optional").notNull().default(false),
  // Ana malzeme: eksikse tarif "hazırlanamaz" sayılır
  isEssential: boolean("is_essential").notNull().default(false),
  sortOrder: smallint("sort_order").notNull().default(0),
}, (t) => [uniqueIndex("ri_recipe_ing_uq").on(t.recipeId, t.ingredientId), index("ri_ing_idx").on(t.ingredientId)]);

export const recipeSteps = pgTable("recipe_steps", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  order: smallint("order").notNull(),
  text: varchar("text", { length: 800 }).notNull(),
}, (t) => [uniqueIndex("rs_recipe_order_uq").on(t.recipeId, t.order)]);

export const favorites = pgTable("favorites", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("fav_user_recipe_uq").on(t.userId, t.recipeId)]);

// ---------- Alışveriş listesi ----------
export const shoppingLists = pgTable("shopping_lists", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull().default("Alışveriş Listem"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("sl_user_uq").on(t.userId)]);

export const shoppingListItems = pgTable("shopping_list_items", {
  id: id(),
  listId: text("list_id").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  name: varchar("name", { length: 80 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: unitEnum("unit"),
  isPurchased: boolean("is_purchased").notNull().default(false),
  fromRecipes: text("from_recipes").array().notNull().default(sql`'{}'::text[]`),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("sli_list_idx").on(t.listId)]);

// ---------- Görüntü analizi ----------
export const imageAnalyses = pgTable("image_analyses", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: analysisStatusEnum("status").notNull().default("PROCESSING"),
  fileName: varchar("file_name", { length: 120 }).notNull(),
  mimeType: varchar("mime_type", { length: 40 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  provider: varchar("provider", { length: 30 }),
  model: varchar("model", { length: 60 }),
  summary: varchar("summary", { length: 600 }),
  error: varchar("error", { length: 300 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("ia_user_created_idx").on(t.userId, t.createdAt)]);

export const imageDetectedIngredients = pgTable("image_detected_ingredients", {
  id: id(),
  analysisId: text("analysis_id").notNull().references(() => imageAnalyses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  matchedIngredientId: integer("matched_ingredient_id").references(() => ingredients.id, { onDelete: "set null" }),
  categorySlug: varchar("category_slug", { length: 40 }).notNull(),
  confidence: real("confidence").notNull(),
  alternatives: text("alternatives").array().notNull().default(sql`'{}'::text[]`),
  estimatedQuantity: numeric("estimated_quantity", { precision: 10, scale: 2 }),
  estimatedUnit: unitEnum("estimated_unit"),
  // Model emin değilse true: kesin tanım gibi gösterilmez
  uncertain: boolean("uncertain").notNull().default(false),
}, (t) => [index("idi_analysis_idx").on(t.analysisId)]);

// ---------- AI sohbet ----------
export const chatSessions = pgTable("chat_sessions", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull().default("Yeni sohbet"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("cs_user_updated_idx").on(t.userId, t.updatedAt)]);

export const chatMessages = pgTable("chat_messages", {
  id: id(),
  sessionId: text("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  recipeIds: integer("recipe_ids").array().notNull().default(sql`'{}'::integer[]`),
  // "ai" | "fallback"
  mode: varchar("mode", { length: 20 }).notNull().default("ai"),
  createdAt: createdAt(),
}, (t) => [index("cm_session_created_idx").on(t.sessionId, t.createdAt)]);

// ---------- İlişkiler ----------
export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  category: one(ingredientCategories, { fields: [ingredients.categoryId], references: [ingredientCategories.id] }),
}));
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  category: one(recipeCategories, { fields: [recipes.categoryId], references: [recipeCategories.id] }),
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
}));
export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, { fields: [recipeIngredients.ingredientId], references: [ingredients.id] }),
}));
export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
}));
export const imageAnalysesRelations = relations(imageAnalyses, ({ many }) => ({
  detected: many(imageDetectedIngredients),
}));
export const imageDetectedRelations = relations(imageDetectedIngredients, ({ one }) => ({
  analysis: one(imageAnalyses, { fields: [imageDetectedIngredients.analysisId], references: [imageAnalyses.id] }),
}));
export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({ messages: many(chatMessages) }));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));

export type Unit = (typeof unitEnum.enumValues)[number];
export type StorageArea = (typeof storageEnum.enumValues)[number];
export type Difficulty = (typeof difficultyEnum.enumValues)[number];
