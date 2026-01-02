import { describe, it, expect, vi } from 'vitest';

// Create stable spies
const mockFirst = vi.fn();
const mockWithIndex = vi.fn(() => ({ first: mockFirst }));
const mockQuery = vi.fn(() => ({ withIndex: mockWithIndex }));

const mockDb = {
  get: vi.fn(),
  insert: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  query: mockQuery,
};

const mockCtx = {
  db: mockDb,
};

// Mock convex/server
vi.mock('../../convex/_generated/server', () => ({
  internalMutation: (args: any) => args,
  query: (args: any) => args,
  mutation: (args: any) => args,
}));

vi.mock('convex/values', () => ({
  v: {
    string: () => 'string',
    optional: () => 'optional',
  },
}));

// Import the real code
import { upsertFromClerk } from '../../convex/users';

describe('Users Logic', () => {
  it('should create a new user if not exists', async () => {
    mockFirst.mockResolvedValue(null); // User not found
    mockDb.insert.mockResolvedValue('user_123');

    const args = {
      clerkId: 'clerk_123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const result = await upsertFromClerk.handler(mockCtx, args);

    expect(result).toBe('user_123');
    expect(mockDb.insert).toHaveBeenCalledWith("users", expect.objectContaining({
      clerkId: args.clerkId,
      email: args.email,
    }));

    // Check audit log
    expect(mockDb.insert).toHaveBeenCalledWith("audit_logs", expect.objectContaining({
      action: "user.upsert_webhook",
      resourceType: "user",
      success: true
    }));
  });

  it('should update existing user', async () => {
    const existingUser = { _id: 'user_123', clerkId: 'clerk_123' };
    mockFirst.mockResolvedValue(existingUser); // User found

    const args = {
      clerkId: 'clerk_123',
      email: 'new@example.com',
      name: 'New Name',
    };

    const result = await upsertFromClerk.handler(mockCtx, args);

    expect(result).toBe('user_123');
    expect(mockDb.patch).toHaveBeenCalledWith('user_123', {
      email: args.email,
      name: args.name,
    });
  });
});
