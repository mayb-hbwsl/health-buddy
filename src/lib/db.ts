/**
 * Mock database interface to replace Prisma with persistence across hot reloads.
 */

export interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string | null;
  age?: number | null;
  weight?: number | null;
  condition?: string | null;
}

export interface HealthEntry {
  id: string;
  userId: string;
  type: string;
  value: string;
  status?: string | null;
  date: Date;
}

// Persist data across hot reloads in development
const globalForDb = global as unknown as {
  mockUsers: User[];
  mockEntries: HealthEntry[];
};

if (!globalForDb.mockUsers) {
  globalForDb.mockUsers = [
    {
      id: "user_1",
      name: "Mayur Srivastav",
      email: "[EMAIL_ADDRESS]",
      password: "[PASSWORD]",
      age: 21,
      weight: 72,
      condition: "None",
    }
  ];
}

if (!globalForDb.mockEntries) {
  globalForDb.mockEntries = [];
}

const mockUsers = globalForDb.mockUsers;
const mockEntries = globalForDb.mockEntries;

export const db = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      if (where.email) return mockUsers.find(u => u.email === where.email) || null;
      if (where.id) return mockUsers.find(u => u.id === where.id) || null;
      return null;
    },
    create: async ({ data }: { data: any }) => {
      const newUser = { id: `user_${Date.now()}`, ...data };
      mockUsers.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = mockUsers.findIndex(u => u.id === where.id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...data };
        return mockUsers[index];
      }
      return null;
    },
    count: async () => mockUsers.length,
  },
  healthEntry: {
    findMany: async ({ where }: { where: { userId: string } }) => {
      return mockEntries.filter(e => e.userId === where.userId);
    },
    create: async ({ data }: { data: any }) => {
      const newEntry = { id: `entry_${Date.now()}`, ...data };
      mockEntries.push(newEntry);
      return newEntry;
    },
  },
};

export default db;
