export type MemoryAuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "CUSTOMER";
  status: "ACTIVE";
  emailVerified: string;
  createdAt: string;
};

const globalAuth = globalThis as typeof globalThis & {
  villakuAuthUsers?: Map<string, MemoryAuthUser>;
};

const store = globalAuth.villakuAuthUsers ?? new Map<string, MemoryAuthUser>();

if (process.env.NODE_ENV !== "production") {
  globalAuth.villakuAuthUsers = store;
}

export function findMemoryAuthUser(email: string) {
  return store.get(email.trim().toLowerCase()) ?? null;
}

export function createMemoryAuthUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const email = input.email.trim().toLowerCase();
  const user: MemoryAuthUser = {
    id: `registered_${crypto.randomUUID()}`,
    name: input.name,
    email,
    passwordHash: input.passwordHash,
    role: "CUSTOMER",
    status: "ACTIVE",
    emailVerified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  store.set(email, user);
  return user;
}
