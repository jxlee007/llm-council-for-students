import { useChats } from './useChats';

export function useChatMessages(chatId: string) {
  const {
    activeChat: conversation,
    messages,
    createAttachment,
    deleteMessage,
    runCouncil,
    isLoading,
  } = useChats(chatId);

  return {
    conversation,
    messages,
    isLoading,
    createAttachment: async (args: { conversationId?: string; fileName: string; fileType: string; extractedText: string }) => {
      return await createAttachment({
        conversationId: args.conversationId || chatId,
        fileName: args.fileName,
        fileType: args.fileType,
        extractedText: args.extractedText,
      });
    },
    deleteMessage: async (args: { id: string }) => {
      await deleteMessage(args.id);
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
      return await runCouncil({
        conversationId: args.conversationId || chatId,
        content: args.content,
        context: args.context,
        attachmentIds: args.attachmentIds,
        councilMembers: args.councilMembers,
        chairmanModel: args.chairmanModel,
        imageBase64: args.imageBase64,
        imageMimeType: args.imageMimeType,
        systemPrompt: args.systemPrompt,
        history: args.history,
      });
    },
  };
}
