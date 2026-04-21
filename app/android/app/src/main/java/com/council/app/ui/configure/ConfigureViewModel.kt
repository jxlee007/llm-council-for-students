package com.council.app.ui.configure

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.council.app.data.model.CouncilModel
import com.council.app.data.repository.ModelRepository
import com.council.app.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConfigureUiState(
    val availableModels: List<CouncilModel> = emptyList(),
    val selectedModels: List<String> = emptyList(),
    val chairmanModel: String? = null,
    val loading: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class ConfigureViewModel @Inject constructor(
    private val modelRepository: ModelRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ConfigureUiState(loading = true))
    val uiState: StateFlow<ConfigureUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            // Load saved config
            val selected = settingsRepository.getCouncilModels()
            val chairman = settingsRepository.getChairmanModel()
            _uiState.value = _uiState.value.copy(selectedModels = selected, chairmanModel = chairman)

            // Fetch available models
            try {
                val models = modelRepository.fetchAvailableModels()
                _uiState.value = _uiState.value.copy(availableModels = models, loading = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = "Failed to fetch models: ${e.message}")
            }
        }
    }

    fun toggleModel(modelId: String) {
        val current = _uiState.value.selectedModels.toMutableList()
        if (current.contains(modelId)) current.remove(modelId) else current.add(modelId)
        _uiState.value = _uiState.value.copy(selectedModels = current)
        viewModelScope.launch { settingsRepository.setCouncilModels(current) }
    }

    fun setChairman(modelId: String?) {
        _uiState.value = _uiState.value.copy(chairmanModel = modelId)
        viewModelScope.launch { settingsRepository.setChairmanModel(modelId) }
    }

    fun refresh() {
        _uiState.value = _uiState.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val models = modelRepository.fetchAvailableModels()
                _uiState.value = _uiState.value.copy(availableModels = models, loading = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(loading = false, error = "Failed: ${e.message}")
            }
        }
    }
}
