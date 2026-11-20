CREATE TYPE "public"."analysis_status" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED', 'CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('USER', 'ASSISTANT');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('KOLAY', 'ORTA', 'ZOR');--> statement-breakpoint
CREATE TYPE "public"."ingredient_source" AS ENUM('MANUAL', 'IMAGE', 'SHOPPING');--> statement-breakpoint
CREATE TYPE "public"."storage_area" AS ENUM('BUZDOLABI', 'DONDURUCU', 'MUTFAK_DOLABI', 'DIGER');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('ADET', 'GRAM', 'KILOGRAM', 'MILILITRE', 'LITRE', 'YEMEK_KASIGI', 'TATLI_KASIGI', 'CAY_KASIGI', 'SU_BARDAGI', 'CAY_BARDAGI', 'PAKET', 'DEMET', 'DIS', 'TUTAM', 'DILIM');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"recipe_ids" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"mode" varchar(20) DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(120) DEFAULT 'Yeni sohbet' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"recipe_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "analysis_status" DEFAULT 'PROCESSING' NOT NULL,
	"file_name" varchar(120) NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"size_bytes" integer NOT NULL,
	"provider" varchar(30),
	"model" varchar(60),
	"summary" varchar(600),
	"error" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_detected_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"matched_ingredient_id" integer,
	"category_slug" varchar(40) NOT NULL,
	"confidence" real NOT NULL,
	"alternatives" text[] DEFAULT '{}'::text[] NOT NULL,
	"estimated_quantity" numeric(10, 2),
	"estimated_unit" "unit",
	"uncertain" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredient_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(40) NOT NULL,
	"name" varchar(60) NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "ingredient_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"category_id" integer NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"default_unit" "unit" DEFAULT 'ADET' NOT NULL,
	"cost_level" smallint DEFAULT 1 NOT NULL,
	"is_meat" boolean DEFAULT false NOT NULL,
	"is_animal_product" boolean DEFAULT false NOT NULL,
	"always_available" boolean DEFAULT false NOT NULL,
	"grams_per_piece" numeric(10, 2),
	CONSTRAINT "ingredients_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "recipe_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(40) NOT NULL,
	"name" varchar(60) NOT NULL,
	"is_virtual" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "recipe_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity" numeric(10, 2),
	"unit" "unit",
	"note" varchar(80),
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_essential" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"order" smallint NOT NULL,
	"text" varchar(800) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" varchar(600) NOT NULL,
	"image_url" varchar(300),
	"emoji" varchar(16) DEFAULT '🍽️' NOT NULL,
	"category_id" integer NOT NULL,
	"prep_minutes" smallint NOT NULL,
	"cook_minutes" smallint NOT NULL,
	"total_minutes" smallint NOT NULL,
	"servings" smallint NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_vegan" boolean DEFAULT false NOT NULL,
	"is_gluten_free" boolean DEFAULT false NOT NULL,
	"is_lactose_free" boolean DEFAULT false NOT NULL,
	"cost_level" numeric(4, 2) NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"nutrition" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"ingredient_id" integer,
	"name" varchar(80) NOT NULL,
	"quantity" numeric(10, 2),
	"unit" "unit",
	"is_purchased" boolean DEFAULT false NOT NULL,
	"from_recipes" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(80) DEFAULT 'Alışveriş Listem' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ingredient_id" integer,
	"name" varchar(80) NOT NULL,
	"category_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" "unit" NOT NULL,
	"storage" "storage_area" DEFAULT 'BUZDOLABI' NOT NULL,
	"expires_at" date,
	"note" varchar(300),
	"source" "ingredient_source" DEFAULT 'MANUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vegetarian" boolean DEFAULT false NOT NULL,
	"vegan" boolean DEFAULT false NOT NULL,
	"gluten_free" boolean DEFAULT false NOT NULL,
	"lactose_free" boolean DEFAULT false NOT NULL,
	"low_budget" boolean DEFAULT false NOT NULL,
	"quick_meals" boolean DEFAULT false NOT NULL,
	"healthy" boolean DEFAULT false NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"allergy_notes" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(60) NOT NULL,
	"last_name" varchar(60) NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_analyses" ADD CONSTRAINT "image_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_detected_ingredients" ADD CONSTRAINT "image_detected_ingredients_analysis_id_image_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."image_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_detected_ingredients" ADD CONSTRAINT "image_detected_ingredients_matched_ingredient_id_ingredients_id_fk" FOREIGN KEY ("matched_ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_ingredient_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_recipe_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."recipe_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_list_id_shopping_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ingredients" ADD CONSTRAINT "user_ingredients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ingredients" ADD CONSTRAINT "user_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ingredients" ADD CONSTRAINT "user_ingredients_category_id_ingredient_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cm_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "cs_user_updated_idx" ON "chat_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fav_user_recipe_uq" ON "favorites" USING btree ("user_id","recipe_id");--> statement-breakpoint
CREATE INDEX "ia_user_created_idx" ON "image_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idi_analysis_idx" ON "image_detected_ingredients" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "ingredients_category_idx" ON "ingredients" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "prt_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ri_recipe_ing_uq" ON "recipe_ingredients" USING btree ("recipe_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "ri_ing_idx" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rs_recipe_order_uq" ON "recipe_steps" USING btree ("recipe_id","order");--> statement-breakpoint
CREATE INDEX "recipes_category_idx" ON "recipes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "recipes_total_idx" ON "recipes" USING btree ("total_minutes");--> statement-breakpoint
CREATE INDEX "sli_list_idx" ON "shopping_list_items" USING btree ("list_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sl_user_uq" ON "shopping_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ui_user_idx" ON "user_ingredients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ui_user_exp_idx" ON "user_ingredients" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "ui_user_ing_idx" ON "user_ingredients" USING btree ("user_id","ingredient_id");