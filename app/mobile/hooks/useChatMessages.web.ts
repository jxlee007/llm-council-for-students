import { useChats, webAttachments } from './useChats';
import { useWebChatStore } from '../store/useWebChatStore';
import { useUIStore } from '../lib/store';
import Config from '../lib/config';

export function useChatMessages(chatId: string) {
  const {
    activeChat: conversation,
    messages,
    isLoading,
    deleteMessage,
  } = useChats(chatId);

  const addMessage = useWebChatStore((state) => state.addMessage);
  const updateMessage = useWebChatStore((state) => state.updateMessage);
  const updateChatTitle = useWebChatStore((state) => state.updateChatTitle);

  const runCouncil = async (args: {
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
    const conversationId = args.conversationId || chatId;
    const {
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

    // 1. Instantly save user message locally
    const userMsgId = `user_${Date.now()}`;
    const imageUrl = imageBase64 ? `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}` : undefined;
    const type = imageBase64 ? (content ? "image_text" : "image") : "text";

    // Retrieve full attachment objects from in-memory cache to send with messages if needed
    const attachments = attachmentIds
      ? attachmentIds.map((id) => webAttachments[id]).filter(Boolean)
      : [];

    addMessage(conversationId, {
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

    // 2. Create the Assistant Placeholder for the stream
    const tempAssistantId = `assistant_${Date.now()}`;
    const placeholderMsg = {
      id: tempAssistantId,
      role: 'assistant' as const,
      content: '', // Will be filled dynamically
      processing: true,
      currentStage: 'stage1',
      createdAt: Date.now() + 10,
    };
    addMessage(conversationId, placeholderMsg);

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

    let accumulatedContent = '';

    try {
      // Load OpenRouter API key from global UI store
      const apiKey = await useUIStore.getState().loadApiKey();

      const response = await fetch(`${Config.apiUrl}/api/conversations/${conversationId}/message/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-OpenRouter-Key': apiKey || '',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend Error: ${response.status} - ${text}`);
      }

      if (!response.body) throw new Error("No response body");

      // 4. Stream Parsing
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();

            if (dataStr === '[DONE]') {
              updateMessage(conversationId, tempAssistantId, { 
                processing: false,
              });
              continue;
            }

            try {
              const event = JSON.parse(dataStr);
              
              // 5. Progressive Updates to Zustand
              const updates: any = {};
              
              if (event.type === "vision_processing") {
                updates.currentStage = "vision";
              } else if (event.type === "vision_complete" && event.data) {
                updateMessage(conversationId, userMsgId, { visionContext: JSON.stringify(event.data) });
              } else if (event.type === "stage1_complete" && event.data) {
                updates.stage1 = event.data;
                updates.currentStage = "stage2";
              } else if (event.type === "stage2_complete" && event.data) {
                updates.stage2 = event.data;
                updates.currentStage = "stage3";
              } else if (event.type === "stage3_complete" && event.data) {
                updates.stage3 = event.data;
                accumulatedContent = event.data.response || '';
                updates.content = accumulatedContent;
              } else if (event.type === "title_complete" && event.data) {
                updateChatTitle(conversationId, event.data.title);
              } else if (event.type === "complete") {
                updates.processing = false;
              } else if (event.type === "error") {
                throw new Error(event.message || "Council processing failed");
              }

              if (Object.keys(updates).length > 0) {
                updateMessage(conversationId, tempAssistantId, updates);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      // Finish processing assistant message
      updateMessage(conversationId, tempAssistantId, { processing: false });
      return { success: true, messageId: tempAssistantId };

    } catch (error: any) {
      console.error("Web Stream Error:", error);
      updateMessage(conversationId, tempAssistantId, {
        processing: false,
        error: error.message || "Council processing failed",
      });
      return { success: false, error: error.message || "Council processing failed" };
    }
  };

  return {
    conversation,
    messages,
    isLoading,
    createAttachment: async (args: { conversationId?: string; fileName: string; fileType: string; extractedText: string }) => {
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
    deleteMessage: async (args: { id: string }) => {
      await deleteMessage(args.id);
    },
    runCouncil,
  };
}
