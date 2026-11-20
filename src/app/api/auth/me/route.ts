import { json, requireUser, route } from "@/lib/api";

export const GET = route(async (req) => json({ user: await requireUser(req) }));
