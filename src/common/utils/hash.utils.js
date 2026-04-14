import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashValue(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function compareHash(plain, hash) {
  return bcrypt.compare(plain, hash);
}
