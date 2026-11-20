import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// Zamanlama saldırılarını azaltmak için: kullanıcı yoksa da bir karşılaştırma yapılır
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO8M6Lo9pSyMIfn8B2VBM1rW5Fq3T1s1e";
export async function fakeVerify() {
  await bcrypt.compare("x", DUMMY_HASH);
}
