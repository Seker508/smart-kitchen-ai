// Testler ayrı bir veritabanı kullanır: TEST_DATABASE_URL (varsayılan: smartkitchen_test)
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/smartkitchen_test";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-1234567890";
process.env.UPLOAD_DIR ??= "./.test-uploads";
process.env.APP_URL ??= "http://localhost:3000";
process.env.SHOW_RESET_LINK_IN_DEV = "true";
// Testlerde gerçek yapay zekâ anahtarı kullanılmaz; sağlayıcı çağrıları fetch mock'u ile test edilir.
delete process.env.OPENAI_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
