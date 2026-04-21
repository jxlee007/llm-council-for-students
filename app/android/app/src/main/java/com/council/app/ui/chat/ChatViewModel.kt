package com.council.app.ui.chat

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.council.app.data.model.*
import com.council.app.data.qwenvision.QwenModel
import com.council.app.data.qwenvision.QwenModelHelper
import com.council.app.data.remote.CouncilEvent
import com.council.app.data.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "ChatViewModel"

data class ChatUiState(
    val title: String = "New Conversation",
    val processing: Boolean = false,
    val currentStage: String? = null,
    val errorMessage: String? = null,
) {
    val statusLabel: String
        get() = when (currentStage) {
            "vision" -> "Analyzing image…"
            "stage1" -> "Individual responses…"
            "stage2" -> "Peer rankings…"
            "stage3" -> "Final synthesis…"
            else -> "Processing…"
        }
}

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val conversationRepository: ConversationRepository,
    private val messageRepository: MessageRepository,
    private val councilRepository: CouncilRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    fun loadConversation(conversationId: String) {
        viewModelScope.launch {
            messageRepository.observeMessages(conversationId).collect { _messages.value = it }
        }
        viewModelScope.launch {
            val conv = conversationRepository.getConversation(conversationId)
            _uiState.update { it.copy(title = conv?.title ?: "New Conversation") }
        }
    }

    fun sendMessage(
        context: Context,
        conversationId: String,
        userText: String,
        pendingImage: Bitmap? = null,
        activeVisionModel: QwenModel? = null,
        systemPrompt: String? = null,
    ) {
        if (userText.isBlank() && pendingImage == null) return
        if (_uiState.value.processing) return

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    processing = true,
                    currentStage = if (pendingImage != null) "vision" else "stage1",
                    errorMessage = null,
                )
            }

            var visionContext: String? = null
            var visionModelName: String? = null

            if (pendingImage != null && activeVisionModel?.instance != null) {
                try {
                    visionContext = runQwenInference(activeVisionModel, pendingImage, userText)
                    visionModelName = activeVisionModel.name
                } catch (e: Exception) {
                    Log.e(TAG, "Vision inference failed: ${e.message}")
                }
            }

            val type = if (pendingImage != null) "image_text" else "text"
            messageRepository.insertUserMessage(
                conversationId = conversationId,
                content = userText,
                type = type,
                visionContext = visionContext,
                visionModelName = visionModelName,
            )

            val assistantMsgId = messageRepository.insertAssistantMessage(conversationId)

            val history = _messages.value
                .filter { !it.processing }
                .takeLast(20)
                .mapNotNull { msg ->
                    when (msg.role) {
                        "user" -> HistoryMessage("user", msg.content)
                        "assistant" -> msg.stage3?.response?.let { HistoryMessage("assistant", it) }
                            ?: msg.stage1?.firstOrNull()?.response?.let { HistoryMessage("assistant", it) }
                        else -> null
                    }
                }

            val councilModels = settingsRepository.getCouncilModels()
            val chairmanModel = settingsRepository.getChairmanModel()

            val request = SendMessageRequest(
                content = userText,
                councilMembers = councilModels,
                chairmanModel = chairmanModel,
                visionContext = visionContext,
                visionModelName = visionModelName,
                systemPrompt = systemPrompt,
                history = history.ifEmpty { null },
            )

            _uiState.update { it.copy(currentStage = "stage1") }

            councilRepository.runCouncil(conversationId, request).collect { event ->
                when (event) {
                    is CouncilEvent.Processing -> _uiState.update { it.copy(currentStage = event.stage) }
                    is CouncilEvent.Stage1Complete -> messageRepository.updateStage1(assistantMsgId, event.responses)
                    is CouncilEvent.Stage2Complete -> messageRepository.updateStage2(assistantMsgId, event.rankings)
                    is CouncilEvent.Stage3Complete -> {
                        messageRepository.updateStage3(assistantMsgId, event.response)
                        conversationRepository.touchConversation(conversationId)
                    }
                    is CouncilEvent.TitleComplete -> {
                        conversationRepository.updateTitle(conversationId, event.title)
                        _uiState.update { it.copy(title = event.title) }
                    }
                    is CouncilEvent.CouncilError -> {
                        messageRepository.markError(assistantMsgId, event.message)
                        _uiState.update { it.copy(processing = false, currentStage = null, errorMessage = event.message) }
                    }
                    else -> {}
                }
            }

            _uiState.update { it.copy(processing = false, currentStage = null) }
        }
    }

    fun clearError() = _uiState.update { it.copy(errorMessage = null) }

    private suspend fun runQwenInference(model: QwenModel, image: Bitmap, userText: String): String {
        val prompt = "Describe this image in detail to provide context for the following question: $userText"
        val result = StringBuilder()
        val done = kotlinx.coroutines.CompletableDeferred<Unit>()
        QwenModelHelper.runInference(model = model, input = prompt, image = image) { partial, isDone ->
            result.append(partial)
            if (isDone) done.complete(Unit)
        }
        done.await()
        return result.toString().trim()
    }
}