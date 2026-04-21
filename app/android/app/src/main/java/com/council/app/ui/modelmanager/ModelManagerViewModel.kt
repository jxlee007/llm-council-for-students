package com.council.app.ui.modelmanager

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.council.app.data.qwenvision.DownloadRepository
import com.council.app.data.qwenvision.DownloadState
import com.council.app.data.qwenvision.DownloadStatus
import com.council.app.data.qwenvision.QwenModel
import com.council.app.data.qwenvision.QwenModelHelper
import com.council.app.data.qwenvision.QWEN_VISION_MODELS
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ModelManagerState(
    val models: List<QwenModel> = QWEN_VISION_MODELS,
    val downloadStates: Map<String, DownloadState> = emptyMap(),
    val loadedModelId: String? = null,
    val isInitializing: Boolean = false,
    val initError: String? = null,
)

@HiltViewModel
class ModelManagerViewModel @Inject constructor(
    private val downloadRepository: DownloadRepository,
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val _state = MutableStateFlow(ModelManagerState())
    val state: StateFlow<ModelManagerState> = _state.asStateFlow()

    init {
        refreshDownloadStates()
        // Observe WorkManager progress for each model
        QWEN_VISION_MODELS.forEach { model ->
            viewModelScope.launch {
                downloadRepository.observeWorkInfo(model).collect { dlState ->
                    _state.update { s ->
                        s.copy(downloadStates = s.downloadStates + (model.id to dlState))
                    }
                }
            }
        }
    }

    fun refreshDownloadStates() {
        val states = QWEN_VISION_MODELS.associate { model ->
            model.id to downloadRepository.getDownloadState(model)
        }
        _state.update { it.copy(downloadStates = states) }
    }

    fun downloadModel(model: QwenModel) {
        downloadRepository.downloadModel(model)
        _state.update { s ->
            s.copy(downloadStates = s.downloadStates + (model.id to DownloadState(status = DownloadStatus.DOWNLOADING, progress = 0f)))
        }
    }

    fun cancelDownload(model: QwenModel) {
        downloadRepository.cancelDownload(model)
        refreshDownloadStates()
    }

    fun loadModel(model: QwenModel) {
        _state.update { it.copy(isInitializing = true, initError = null) }
        viewModelScope.launch {
            QwenModelHelper.initialize(context, model) { error ->
                _state.update { s ->
                    s.copy(
                        isInitializing = false,
                        loadedModelId = if (error.isEmpty()) model.id else s.loadedModelId,
                        initError = if (error.isNotEmpty()) error else null,
                    )
                }
            }
        }
    }

    fun unloadModel(model: QwenModel) {
        QwenModelHelper.cleanup(model)
        _state.update { it.copy(loadedModelId = null, initError = null) }
    }

    fun deleteModel(model: QwenModel) {
        unloadModel(model)
        downloadRepository.deleteModel(model)
        refreshDownloadStates()
    }

    /** Returns the currently loaded QwenModel instance if available. */
    fun getActiveModel(): QwenModel? {
        val loadedId = _state.value.loadedModelId ?: return null
        return QWEN_VISION_MODELS.find { it.id == loadedId }
    }
}
