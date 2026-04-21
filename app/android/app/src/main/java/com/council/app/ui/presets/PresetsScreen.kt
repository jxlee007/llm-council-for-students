package com.council.app.ui.presets

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.data.model.Preset
import com.council.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PresetsScreen(
    onNavigateUp: () -> Unit,
    viewModel: PresetsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val allPresets = state.builtInPresets + state.customPresets
    val activeId = state.activePresetId

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
                    Text("Presets", color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                Text(
                    "Select a system prompt preset that shapes how the council responds.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CouncilTextSecondary,
                )
                Spacer(Modifier.height(8.dp))
            }
            items(allPresets, key = { it.id }) { preset ->
                PresetCard(
                    preset = preset,
                    isActive = preset.id == activeId,
                    onSelect = {
                        viewModel.selectPreset(if (preset.id == activeId) null else preset.id)
                    },
                    onDelete = if (!preset.isBuiltIn) ({ viewModel.deletePreset(preset.id) }) else null,
                )
            }
        }
    }
}

@Composable
private fun PresetCard(
    preset: Preset,
    isActive: Boolean,
    onSelect: () -> Unit,
    onDelete: (() -> Unit)?,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onSelect),
        color = if (isActive) CouncilCyanDim else CouncilSurface,
        shape = RoundedCornerShape(12.dp),
        border = if (isActive) BorderStroke(1.dp, CouncilCyan) else BorderStroke(1.dp, CouncilBorder),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    preset.name,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (isActive) CouncilCyan else CouncilTextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    preset.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = CouncilTextSecondary,
                )
                if (!preset.isBuiltIn) {
                    Spacer(Modifier.height(4.dp))
                    Text("Custom", style = MaterialTheme.typography.labelSmall, color = CouncilAmber)
                }
            }
            if (isActive) {
                Icon(Icons.Default.Check, "Active", tint = CouncilCyan, modifier = Modifier.size(18.dp))
            }
            if (onDelete != null) {
                IconButton(onClick = onDelete) {
                    Icon(Icons.Outlined.Delete, "Delete", tint = CouncilTextMuted, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}