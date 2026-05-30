import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export interface ChatFacade {
  isLoading: boolean;
  chats: any[];
  activeChat?: any;
  messages?: any[];
  createChat: (title: string, modelConfig?: string[]) => Promise<string>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createAttachment: (args: {
    conversationId: string;
    fileName: string;
    fileType: string;
    extractedText: string;
  }) => Promise<string>;
  runCouncil: (args: {
    conversationId: string;
    content: string;
    context?: string;
    attachmentIds?: string[];
    councilMembers?: string[];
    chairmanModel?: string;
    imageBase64?: string;
    imageMimeType?: string;
    systemPrompt?: string;
    history?: any[];
  }) => Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export function useChats(activeChatId?: string): ChatFacade {
  const convexChats = useQuery(api.conversations.list) || [];
  const convexActiveChat = activeChatId ? useQuery(api.conversations.get, { id: activeChatId as Id<"conversations"> }) : null;
  const convexMessages = activeChatId ? useQuery(api.messages.list, { conversationId: activeChatId as Id<"conversations"> }) : [];
  
  const convexCreateChat = useMutation(api.conversations.create);
  const convexDeleteChat = useMutation(api.conversations.remove);
  const convexDeleteMessage = useMutation(api.messages.remove);
  const convexCreateAttachment = useMutation(api.attachments.create);
  const convexRunCouncil = useAction(api.council.runCouncil);

  // Format data to match UI expectations
  const formattedChats = convexChats.map((c) => ({
    id: c._id,
    title: c.title,
    updatedAt: c.lastMessageAt,
    messages: [],
    modelConfig: c.modelConfig,
  }));

  const formattedActiveChat = convexActiveChat ? {
    id: convexActiveChat._id,
    title: convexActiveChat.title,
    updatedAt: convexActiveChat.lastMessageAt,
    messages: [],
    modelConfig: convexActiveChat.modelConfig,
  } : undefined;

  const formattedMessages = (convexMessages || []).map((m) => ({
    id: m._id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    stage1: m.stage1,
    stage2: m.stage2,
    stage3: m.stage3,
    processing: m.processing,
    currentStage: m.currentStage,
    error: m.error,
    imageBase64: m.imageBase64,
    imageUrl: m.imageUrl,
    type: m.type,
    attachmentIds: m.attachmentIds,
    attachments: (m as any).attachments || [],
  }));

  return {
    isLoading: convexChats === undefined || (activeChatId !== undefined && (convexActiveChat === undefined || convexMessages === undefined)),
    chats: formattedChats,
    activeChat: formattedActiveChat,
    messages: formattedMessages,
    createChat: async (title, modelConfig) => {
      return await convexCreateChat({ title, modelConfig });
    },
    deleteChat: async (chatId) => {
      await convexDeleteChat({ id: chatId as Id<"conversations"> });
    },
    sendMessage: async (chatId, content) => {
      // Stub for general sendMessage if needed
    },
    deleteMessage: async (messageId) => {
      await convexDeleteMessage({ id: messageId as Id<"messages"> });
    },
    createAttachment: async (args) => {
      return await convexCreateAttachment({
        conversationId: args.conversationId as Id<"conversations">,
        fileName: args.fileName,
        fileType: args.fileType,
        extractedText: args.extractedText,
      });
    },
    runCouncil: async (args) => {
      const result = await convexRunCouncil({
        conversationId: args.conversationId as Id<"conversations">,
        content: args.content,
        context: args.context,
        attachmentIds: args.attachmentIds as Id<"attachments">[] | undefined,
        councilMembers: args.councilMembers,
        chairmanModel: args.chairmanModel,
        imageBase64: args.imageBase64,
        imageMimeType: args.imageMimeType,
        systemPrompt: args.systemPrompt,
        history: args.history,
      });
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    },
  };
}
