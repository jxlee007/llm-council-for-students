import { useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

const EMPTY_MESSAGES: any[] = [];

export function useChatMessages(chatId: string) {
  const conversation = useQuery(api.conversations.get, { id: chatId as Id<"conversations"> });
  const messages = useQuery(api.messages.list, { conversationId: chatId as Id<"conversations"> });
  const convexCreateAttachment = useMutation(api.attachments.create);
  const convexDeleteMessage = useMutation(api.messages.remove);
  const convexRunCouncil = useAction(api.council.runCouncil);

  // Format messages to match UI expectation, wrapped in useMemo for reference stability
  const formattedMessages = useMemo(() => {
    if (!messages) return EMPTY_MESSAGES;
    return messages.map((m) => ({
      id: m._id,
      _id: m._id,
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
  }, [messages]);

  const formattedConversation = conversation ? {
    id: conversation._id,
    _id: conversation._id,
    title: conversation.title,
    updatedAt: conversation.lastMessageAt,
    modelConfig: conversation.modelConfig,
  } : conversation; // returns null/undefined as is

  return {
    conversation: formattedConversation,
    messages: formattedMessages,
    isLoading: conversation === undefined || messages === undefined,
    createAttachment: async (args: { conversationId?: string; fileName: string; fileType: string; extractedText: string }) => {
      return await convexCreateAttachment({
        conversationId: (args.conversationId || chatId) as Id<"conversations">,
        fileName: args.fileName,
        fileType: args.fileType,
        extractedText: args.extractedText,
      });
    },
    deleteMessage: async (args: { id: string }) => {
      await convexDeleteMessage({ id: args.id as Id<"messages"> });
    },
    runCouncil: async (args: {
      conversationId?: string;
      content: string;
      context?: string;
      attachmentIds?: string[];
      councilMembers?: string[];
      chairmanModel?: string;
      imageBase64?: string;
      imageMimeType?: string;
      systemPrompt?: string;
      history?: any[];
    }) => {
      const result = await convexRunCouncil({
        conversationId: (args.conversationId || chatId) as Id<"conversations">,
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
      return result;
    },
  };
}
