import { z } from "zod";
import type { StorageArea, Unit } from "@/db/schema";
import { ALLERGEN_CODES, INGREDIENT_CATEGORY_SLUGS, STORAGE_AREAS, UNITS } from "./constants";

const name = (label: string) =>
  z.string({ error: `${label} zorunludur.` }).trim().min(2, `${label} en az 2 karakter olmalıdır.`)
    .max(60, `${label} en fazla 60 karakter olabilir.`)
    .regex(/^[\p{L}\s'.-]+$/u, `${label} yalnızca harf içermelidir.`);

export const passwordSchema = z.string({ error: "Şifre zorunludur." })
  .min(8, "Şifre en az 8 karakter olmalıdır.")
  .max(128, "Şifre en fazla 128 karakter olabilir.")
  .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, "Şifre en az bir harf içermelidir.")
  .regex(/\d/, "Şifre en az bir rakam içermelidir.");

const email = z.string({ error: "E-posta zorunludur." }).trim().toLowerCase()
  .email("Geçerli bir e-posta adresi girin.").max(160);

export const registerSchema = z.object({
  firstName: name("Ad"),
  lastName: name("Soyad"),
  email,
  password: passwordSchema,
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Şifre zorunludur.").max(128) });
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre zorunludur."),
  newPassword: passwordSchema,
});
export const profileSchema = z.object({ firstName: name("Ad"), lastName: name("Soyad"), email });

export const preferencesSchema = z.object({
  vegetarian: z.boolean(), vegan: z.boolean(), glutenFree: z.boolean(), lactoseFree: z.boolean(),
  lowBudget: z.boolean(), quickMeals: z.boolean(), healthy: z.boolean(),
  allergens: z.array(z.enum(ALLERGEN_CODES as [string, ...string[]])).max(20),
  allergyNotes: z.string().trim().max(500).nullable().optional(),
});

const unit = z.enum(UNITS as [Unit, ...Unit[]], { error: "Geçersiz ölçü birimi." });
const storage = z.enum(STORAGE_AREAS as [StorageArea, ...StorageArea[]], { error: "Geçersiz saklama alanı." });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG biçiminde olmalıdır.")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Geçersiz tarih.");
const quantity = z.coerce.number({ error: "Miktar sayı olmalıdır." })
  .positive("Miktar 0'dan büyük olmalıdır.").max(100000, "Miktar çok büyük.");

export const ingredientInputSchema = z.object({
  ingredientId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2, "Malzeme adı en az 2 karakter olmalıdır.").max(80),
  categorySlug: z.enum(INGREDIENT_CATEGORY_SLUGS as [string, ...string[]]).optional(),
  quantity,
  unit,
  storage: storage.default("BUZDOLABI"),
  expiresAt: isoDate.nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});
export type IngredientInput = z.infer<typeof ingredientInputSchema>;

export const ingredientUpdateSchema = z.object({
  quantity: quantity.optional(),
  unit: unit.optional(),
  storage: storage.optional(),
  expiresAt: isoDate.nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
}).refine((o) => Object.keys(o).length > 0, "Güncellenecek alan yok.");

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.string().max(40).optional(),
  storage: storage.optional(),
  sort: z.enum(["expiry", "name", "recent", "quantity"]).default("expiry"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const recommendSchema = z.object({
  category: z.string().max(40).optional(),
  categories: z.array(z.string().max(40)).max(10).optional(),
  sort: z.enum(["onerilen", "uyum", "eksik", "sure", "ekonomik", "skt"]).default("onerilen"),
  onlyComplete: z.boolean().default(false),
  includeConflicts: z.boolean().default(false),
  maxMinutes: z.number().int().min(1).max(1000).optional(),
  q: z.string().trim().max(60).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(60).default(12),
});

export const shoppingItemSchema = z.object({
  ingredientId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2, "Ürün adı en az 2 karakter olmalıdır.").max(80),
  quantity: quantity.nullable().optional(),
  unit: unit.nullable().optional(),
});
export const shoppingUpdateSchema = z.object({
  isPurchased: z.boolean().optional(),
  quantity: quantity.nullable().optional(),
  unit: unit.nullable().optional(),
  name: z.string().trim().min(2).max(80).optional(),
});
export const fromRecipeSchema = z.object({ recipeId: z.number().int().positive(), servings: z.number().int().min(1).max(50).optional() });

export const confirmAnalysisSchema = z.object({
  items: z.array(z.object({
    name: z.string().trim().min(2).max(80),
    ingredientId: z.number().int().positive().nullable().optional(),
    quantity,
    unit,
    storage: storage.default("BUZDOLABI"),
    expiresAt: isoDate.nullable().optional(),
  })).min(1, "En az bir ürün onaylamalısınız.").max(60),
});

export const chatSchema = z.object({
  sessionId: z.string().max(60).nullable().optional(),
  message: z.string().trim().min(1, "Mesaj boş olamaz.").max(1000, "Mesaj en fazla 1000 karakter olabilir."),
});
