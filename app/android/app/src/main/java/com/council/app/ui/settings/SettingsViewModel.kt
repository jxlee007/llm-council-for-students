package com.council.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.council.app.data.repository.AuthRepository
import com.council.app.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.ktor.client.request.get
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// Single definition of ConnectionStatus used by both Screen and ViewModel
enum class ConnectionStatus { IDLE, TESTING, SUCCESS, FAILED }

data class SettingsUiState(
    val apiUrl: String = "",
    val hasApiKey: Boolean = false,
    val connectionStatus: ConnectionStatus = ConnectionStatus.IDLE,
    val userEmail: String? = null,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                settingsRepository.observeApiUrl(),
                settingsRepository.observeHasOpenRouterKey(),
            ) { url, hasKey ->
                _uiState.update { it.copy(apiUrl = url, hasApiKey = hasKey) }
            }.collect()
        }
        _uiState.update { it.copy(userEmail = authRepository.currentUserEmail) }
    }

    fun setApiUrl(url: String) {
        viewModelScope.launch { settingsRepository.setApiUrl(url) }
    }

    fun saveKey(key: String) {
        viewModelScope.launch { settingsRepository.setOpenRouterKey(key) }
    }

    fun clearKey() {
        viewModelScope.launch { settingsRepository.clearOpenRouterKey() }
    }

    fun testConnection() {
        _uiState.update { it.copy(connectionStatus = ConnectionStatus.TESTING) }
        viewModelScope.launch {
            try {
                val url = "${settingsRepository.getApiUrl().trimEnd('/')}/health"
                val client = io.ktor.client.HttpClient(io.ktor.client.engine.android.Android)
                val response = client.get(url)
                client.close()
                _uiState.update {
                    it.copy(
                        connectionStatus = if (response.status.value in 200..299)
                            ConnectionStatus.SUCCESS else ConnectionStatus.FAILED
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(connectionStatus = ConnectionStatus.FAILED) }
            }
        }
    }
}