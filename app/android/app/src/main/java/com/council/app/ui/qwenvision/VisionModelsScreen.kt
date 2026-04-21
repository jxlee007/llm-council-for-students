package com.council.app.ui.qwenvision

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.*
import com.council.app.data.qwenvision.QwenModel
import com.council.app.data.qwenvision.QwenModelHelper
import com.council.app.data.qwenvision.QWEN_VISION_MODELS
import com.council.app.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

enum class VisionModelStatus { NOT_DOWNLOADED, DOWNLOADED, INITIALIZED, ERROR }

data class VisionModelState(
    val model: QwenModel,
    val status: VisionModelStatus = VisionModelStatus.NOT_DOWNLOADED,
    val downloadProgress: Float = 0f,
    val error: String? = null,
)

// ── ViewModel ────────────────────────────────────────────────────────────────

@HiltViewModel
class VisionModelsViewModel @Inject constructor() : ViewModel() {

    private val _states = MutableStateFlow<List<VisionModelState>>(
        QWEN_VISION_MODELS.map { VisionModelState(it) }
    )
    val states: StateFlow<List<VisionModelState>> = _states.asStateFlow()

    fun refreshDownloadStatus(context: Context) {
        _states.update { list ->
            list.map { state ->
                val downloaded = File(context.filesDir, state.model.downloadFileName).exists()
                val hasInstance = state.model.instance != null
                state.copy(
                    status = when {
                        hasInstance -> VisionModelStatus.INITIALIZED
                        downloaded -> VisionModelStatus.DOWNLOADED
                        else -> VisionModelStatus.NOT_DOWNLOADED
                    }
                )
            }
        }
    }

    fun loadModel(context: Context, model: QwenModel) {
        updateState(model.id) { it.copy(status = VisionModelStatus.DOWNLOADED) } // show loading indication via INITIALIZED
        viewModelScope.launch {
            QwenModelHelper.initialize(context, model) { errorMsg ->
                if (errorMsg.isEmpty()) {
                    updateState(model.id) { it.copy(status = VisionModelStatus.INITIALIZED, error = null) }
                } else {
                    updateState(model.id) { it.copy(status = VisionModelStatus.DOWNLOADED, error = errorMsg) }
                }
            }
        }
    }

    fun unloadModel(model: QwenModel) {
        QwenModelHelper.cleanup(model)
        updateState(model.id) { it.copy(status = VisionModelStatus.DOWNLOADED, error = null) }
    }

    fun deleteModel(context: Context, model: QwenModel) {
        QwenModelHelper.cleanup(model)
        File(context.filesDir, "models/${model.id}.bin").delete()
        updateState(model.id) { it.copy(status = VisionModelStatus.NOT_DOWNLOADED, error = null) }
    }

    private fun updateState(modelId: String, update: (VisionModelState) -> VisionModelState) {
        _states.update { list -> list.map { if (it.model.id == modelId) update(it) else it } }
    }
}

// ── Screen ───────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VisionModelsScreen(
    onNavigateUp: () -> Unit,
    viewModel: VisionModelsViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val states by viewModel.states.collectAsState()

    LaunchedEffect(Unit) { viewModel.refreshDownloadStatus(context) }

    Scaffold(
        containerColor = CouncilInk,
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onNavigateUp) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = CouncilTextSecondary)
                    }
                },
                title = {
                    Column {
                        Text("Vision Models", color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
                        Text("On-device · Private", style = MaterialTheme.typography.labelSmall, color = CouncilCyan)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Surface(color = CouncilCyanDim, shape = RoundedCornerShape(8.dp)) {
                    Text(
                        "These models run entirely on your device. Images are never uploaded to any server.",
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodySmall,
                        color = CouncilCyan,
                    )
                }
            }
            items(states, key = { it.model.id }) { state ->
                VisionModelCard(
                    state = state,
                    onLoad = { viewModel.loadModel(context, state.model) },
                    onUnload = { viewModel.unloadModel(state.model) },
                    onDelete = { viewModel.deleteModel(context, state.model) },
                )
            }
        }
    }
}

@Composable
private fun VisionModelCard(
    state: VisionModelState,
    onLoad: () -> Unit,
    onUnload: () -> Unit,
    onDelete: () -> Unit,
) {
    Surface(
        color = CouncilSurface,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    modifier = Modifier.size(36.dp).clip(CircleShape)
                        .then(
                            when (state.status) {
                                VisionModelStatus.INITIALIZED -> Modifier.background(CouncilGreenDim)
                                VisionModelStatus.DOWNLOADED -> Modifier.background(CouncilCyanDim)
                                else -> Modifier.background(CouncilCard)
                            }
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        when (state.status) {
                            VisionModelStatus.INITIALIZED -> "✓"
                            VisionModelStatus.DOWNLOADED -> "▶"
                            else -> "⬇"
                        },
                        color = when (state.status) {
                            VisionModelStatus.INITIALIZED -> CouncilGreen
                            VisionModelStatus.DOWNLOADED -> CouncilCyan
                            else -> CouncilTextMuted
                        },
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(state.model.name, style = MaterialTheme.typography.bodyMedium, color = CouncilTextPrimary, fontWeight = FontWeight.Medium)
                    Text(
                        formatBytes(state.model.sizeBytes),
                        style = MaterialTheme.typography.labelSmall,
                        color = CouncilTextMuted,
                    )
                }
                when (state.status) {
                    VisionModelStatus.NOT_DOWNLOADED -> {
                        // Download handled by user pressing Download button below
                    }
                    VisionModelStatus.DOWNLOADED -> {
                        IconButton(onClick = onDelete) {
                            Icon(Icons.Outlined.Delete, "Delete", tint = CouncilTextMuted, modifier = Modifier.size(18.dp))
                        }
                    }
                    VisionModelStatus.INITIALIZED -> {
                        IconButton(onClick = onUnload) {
                            Icon(Icons.Outlined.Stop, "Unload", tint = CouncilAmber, modifier = Modifier.size(18.dp))
                        }
                    }
                    else -> {}
                }
            }

            state.error?.let { err ->
                Spacer(Modifier.height(8.dp))
                Text(err, style = MaterialTheme.typography.labelSmall, color = CouncilRed)
            }

            Spacer(Modifier.height(10.dp))

            when (state.status) {
                VisionModelStatus.NOT_DOWNLOADED -> {
                    Button(
                        onClick = { /* TODO: trigger WorkManager download */ },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Icon(Icons.Outlined.Download, null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Download (${formatBytes(state.model.sizeBytes)})", fontWeight = FontWeight.SemiBold)
                    }
                }
                VisionModelStatus.DOWNLOADED -> {
                    OutlinedButton(
                        onClick = onLoad,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = CouncilCyan),
                    ) {
                        Icon(Icons.Outlined.PlayArrow, null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Load into Memory", fontWeight = FontWeight.Medium)
                    }
                }
                VisionModelStatus.INITIALIZED -> {
                    Surface(color = CouncilGreenDim, shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Text("Model active and ready", modifier = Modifier.padding(10.dp), style = MaterialTheme.typography.bodySmall, color = CouncilGreen)
                    }
                }
                VisionModelStatus.ERROR -> {
                    OutlinedButton(
                        onClick = onLoad,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = CouncilRed),
                    ) { Text("Retry Load") }
                }
            }
        }
    }
}

private fun formatBytes(bytes: Long): String {
    return when {
        bytes >= 1_000_000_000 -> "%.1f GB".format(bytes / 1_000_000_000.0)
        bytes >= 1_000_000 -> "%.0f MB".format(bytes / 1_000_000.0)
        else -> "%.0f KB".format(bytes / 1_000.0)
    }
}