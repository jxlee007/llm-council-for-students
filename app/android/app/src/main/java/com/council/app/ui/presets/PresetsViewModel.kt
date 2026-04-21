package com.council.app.ui.presets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.council.app.data.model.Preset
import com.council.app.data.model.BUILT_IN_PRESETS
import com.council.app.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class PresetsState(
    val builtInPresets: List<Preset> = BUILT_IN_PRESETS,
    val customPresets: List<Preset> = emptyList(),
    val activePresetId: String? = null,
    val showCreateDialog: Boolean = false,
    val editingPreset: Preset? = null,
)

@HiltViewModel
class PresetsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(PresetsState())
    val state: StateFlow<PresetsState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                settingsRepository.observeCustomPresets(),
                settingsRepository.observeActivePresetId(),
            ) { custom, activeId ->
                _state.update { it.copy(customPresets = custom, activePresetId = activeId) }
            }.collect()
        }
    }

    fun selectPreset(presetId: String?) {
        viewModelScope.launch {
            settingsRepository.setActivePresetId(presetId)
        }
    }

    fun startCreatePreset() {
        _state.update { it.copy(showCreateDialog = true, editingPreset = null) }
    }

    fun startEditPreset(preset: Preset) {
        _state.update { it.copy(showCreateDialog = true, editingPreset = preset) }
    }

    fun dismissDialog() {
        _state.update { it.copy(showCreateDialog = false, editingPreset = null) }
    }

    fun savePreset(name: String, systemPrompt: String) {
        val preset = _state.value.editingPreset?.copy(name = name, systemPrompt = systemPrompt)
            ?: Preset(
                id = UUID.randomUUID().toString(),
                name = name,
                systemPrompt = systemPrompt,
                isBuiltIn = false,
            )
        viewModelScope.launch {
            settingsRepository.saveCustomPreset(preset)
        }
        dismissDialog()
    }

    fun deletePreset(presetId: String) {
        viewModelScope.launch {
            settingsRepository.deleteCustomPreset(presetId)
            // If deleted was active, clear active
            if (_state.value.activePresetId == presetId) {
                settingsRepository.setActivePresetId(null)
            }
        }
    }
}
