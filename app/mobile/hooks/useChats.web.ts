import { useWebChatStore } from '../store/useWebChatStore';
import Config from '../lib/config';

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
  toggleStarChat: (chatId: string) => Promise<void>;
}

// In-memory store for Web attachments since they are transient/local
const webAttachments: Record<string, any> = {};

// Stable memory references outside render cycle
const EMPTY_MESSAGES: any[] = [];
const EMPTY_CHATS: any[] = [];

export function useChats(activeChatId?: string): ChatFacade {
  const webChatsMap = useWebChatStore((state) => state.chats);
  const isHydrated = useWebChatStore((state) => state._hasHydrated);
  const webAddChat = useWebChatStore((state) => state.addChat);
  const webDeleteChat = useWebChatStore((state) => state.deleteChat);
  const webAddMessage = useWebChatStore((state) => state.addMessage);
  const webUpdateMessage = useWebChatStore((state) => state.updateMessage);
  const webUpdateChatTitle = useWebChatStore((state) => state.updateChatTitle);
  const webDeleteMessage = useWebChatStore((state) => state.deleteMessage);
  const webToggleStarChat = useWebChatStore((state) => state.toggleStarChat);

  // Convert dictionary to sorted array for the UI, mapped to fit Convex format
  const rawChatsArray = Object.values(webChatsMap).sort((a, b) => b.updatedAt - a.updatedAt);
  const formattedChats = rawChatsArray.length > 0 
    ? rawChatsArray.map((c) => ({
        _id: c.id,
        title: c.title,
        lastMessageAt: c.updatedAt,
        _creationTime: c.updatedAt,
        modelConfig: c.modelConfig,
        isStarred: !!c.isStarred,
      }))
    : EMPTY_CHATS;

  const activeChatRaw = activeChatId ? webChatsMap[activeChatId] : undefined;
  const formattedActiveChat = activeChatRaw ? {
    _id: activeChatRaw.id,
    title: activeChatRaw.title,
    lastMessageAt: activeChatRaw.updatedAt,
    _creationTime: activeChatRaw.updatedAt,
    modelConfig: activeChatRaw.modelConfig,
    isStarred: !!activeChatRaw.isStarred,
  } : undefined;

  const messages = activeChatRaw ? activeChatRaw.messages : EMPTY_MESSAGES;

  const handleWebRunCouncil = async (args: {
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
  }) => {
    const {
      conversationId,
      content,
      context,
      attachmentIds,
      councilMembers,
      chairmanModel,
      imageBase64,
      imageMimeType,
      systemPrompt,
      history,
    } = args;

    // 1. Create and add user message locally
    const userMsgId = `user_${Date.now()}`;
    const imageUrl = imageBase64 ? `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}` : undefined;
    const type = imageBase64 ? (content ? "image_text" : "image") : "text";

    // Retrieve full attachment objects from in-memory cache to send with messages if needed
    const attachments = attachmentIds
      ? attachmentIds.map((id) => webAttachments[id]).filter(Boolean)
      : [];

    webAddMessage(conversationId, {
      id: userMsgId,
      role: 'user',
      content,
      createdAt: Date.now(),
      imageBase64,
      imageUrl,
      type,
      attachmentIds,
      attachments,
    });

    // 2. Create and add assistant placeholder message with processing = true
    const assistantMsgId = `assistant_${Date.now()}`;
    webAddMessage(conversationId, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now() + 10,
      processing: true,
      currentStage: 'stage1',
    });

    // 3. Prepare POST request body
    const llmPrompt = context ? `${context}\n\n${content}` : content;
    const body: Record<string, any> = {
      content: llmPrompt,
      history: history || [],
    };
    if (councilMembers && councilMembers.length > 0) body.council_members = councilMembers;
    if (chairmanModel) body.chairman_model = chairmanModel;
    if (imageBase64) {
      body.image_data = {
        data: imageBase64,
        mime_type: imageMimeType || 'image/jpeg',
      };
    }
    if (systemPrompt) body.system_prompt = systemPrompt;

    try {
      const response = await fetch(`${Config.apiUrl}/api/conversations/${conversationId}/message/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend Error: ${response.status} - ${text}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              
              if (event.type === "vision_processing") {
                webUpdateMessage(conversationId, assistantMsgId, { currentStage: "vision" });
              } else if (event.type === "vision_complete" && event.data) {
                webUpdateMessage(conversationId, userMsgId, { visionContext: JSON.stringify(event.data) });
              } else if (event.type === "stage1_complete" && event.data) {
                webUpdateMessage(conversationId, assistantMsgId, { stage1: event.data, currentStage: "stage2" });
              } else if (event.type === "stage2_complete" && event.data) {
                webUpdateMessage(conversationId, assistantMsgId, { stage2: event.data, currentStage: "stage3" });
              } else if (event.type === "stage3_complete" && event.data) {
                webUpdateMessage(conversationId, assistantMsgId, {
                  stage3: event.data,
                  content: event.data.response,
                });
              } else if (event.type === "title_complete" && event.data) {
                webUpdateChatTitle(conversationId, event.data.title);
              } else if (event.type === "error") {
                throw new Error(event.message || "Council processing failed");
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }

      // Finish processing assistant message
      webUpdateMessage(conversationId, assistantMsgId, { processing: false });
      return { success: true, messageId: assistantMsgId };

    } catch (error: any) {
      console.error("Web Stream Error:", error);
      webUpdateMessage(conversationId, assistantMsgId, {
        processing: false,
        error: error.message || "Council processing failed",
      });
      return { success: false, error: error.message || "Council processing failed" };
    }
  };

  return {
    isLoading: !isHydrated,
    chats: formattedChats,
    activeChat: formattedActiveChat,
    messages,
    createChat: async (title, modelConfig) => {
      const newId = `web_${Date.now()}`;
      webAddChat({ id: newId, title, updatedAt: Date.now(), messages: [], modelConfig });
      return newId;
    },
    deleteChat: async (id) => webDeleteChat(id),
    sendMessage: async () => {}, // Handled by runCouncil
    deleteMessage: async (id) => {
      if (activeChatId) {
        webDeleteMessage(activeChatId, id);
      }
    },
    createAttachment: async (args) => {
      const attachmentId = `attach_${Date.now()}`;
      webAttachments[attachmentId] = {
        _id: attachmentId,
        fileName: args.fileName,
        fileType: args.fileType,
        extractedText: args.extractedText,
        createdAt: Date.now(),
      };
      return attachmentId;
    },
    runCouncil: handleWebRunCouncil,
    toggleStarChat: async (id) => {
      webToggleStarChat(id);
    },
  };
}
