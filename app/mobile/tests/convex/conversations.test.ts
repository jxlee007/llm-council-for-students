import { describe, it, expect, vi } from 'vitest';

// Create stable spies for chained methods
const mockCollect = vi.fn(() => []);
const mockWithIndex = vi.fn(() => ({ collect: mockCollect }));
const mockQuery = vi.fn(() => ({ withIndex: mockWithIndex }));

const mockDb = {
  get: vi.fn(),
  insert: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  query: mockQuery,
};

const mockAuth = {
  getUserIdentity: vi.fn(),
};

const mockCtx = {
  db: mockDb,
  auth: mockAuth,
};

// Mock checkRateLimit since it's imported (if needed)
vi.mock('../../convex/rateLimits', () => ({
  checkRateLimit: vi.fn(),
}));

// Mock convex/server
vi.mock('../../convex/_generated/server', () => ({
  mutation: (args: any) => args,
  query: (args: any) => args,
}));

vi.mock('convex/values', () => ({
  v: {
    id: () => 'id',
    string: () => 'string',
    optional: () => 'optional',
    array: () => 'array',
  },
}));

// Import the real code
import { remove } from '../../convex/conversations';

describe('Conversations Logic', () => {
  it('should remove a conversation and create an audit log', async () => {
    // Setup
    const userId = 'user_123';
    const conversationId = 'conv_123';
    const messageId = 'msg_123';

    mockAuth.getUserIdentity.mockResolvedValue({ subject: userId });
    mockDb.get.mockResolvedValue({ userId: userId }); // Conversation owned by user

    // Setup query mock to return messages
    mockCollect.mockResolvedValue([{ _id: messageId }]);

    // Execute
    await remove.handler(mockCtx, { id: conversationId });

    // Assert
    // Verify messages deleted
    expect(mockDb.delete).toHaveBeenCalledWith(messageId);
    // Verify conversation deleted
    expect(mockDb.delete).toHaveBeenCalledWith(conversationId);

    // Verify audit log
    expect(mockDb.insert).toHaveBeenCalledWith("audit_logs", expect.objectContaining({
      userId,
      action: 'conversation.delete',
      resourceId: conversationId,
      resourceType: 'conversation',
      success: true,
    }));
  });

  it('should throw if unauthorized', async () => {
    mockAuth.getUserIdentity.mockResolvedValue(null);
    await expect(remove.handler(mockCtx, { id: 'conv_123' })).rejects.toThrow("Unauthorized");
  });
});
