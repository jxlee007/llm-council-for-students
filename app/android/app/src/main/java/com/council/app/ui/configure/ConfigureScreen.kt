package com.council.app.ui.configure

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.data.model.CouncilModel
import com.council.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfigureScreen(
    onNavigateUp: () -> Unit,
    viewModel: ConfigureViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        containerColor = CouncilInk,
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onNavigateUp) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = CouncilTextSecondary)
                    }
                },
                title = { Text("Configure Council", color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold) },
                actions = {
                    IconButton(onClick = viewModel::refresh) {
                        Icon(Icons.Outlined.Refresh, "Refresh", tint = CouncilTextSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Section: Council members
            item {
                SectionHeader("Council Members (${uiState.selectedModels.size} selected)")
            }

            if (uiState.loading) {
                item { LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = CouncilCyan, trackColor = CouncilBorder) }
            }

            if (uiState.error != null) {
                item {
                    Surface(color = CouncilRed.copy(alpha = 0.1f), shape = RoundedCornerShape(8.dp)) {
                        Text(uiState.error ?: "", modifier = Modifier.padding(12.dp), color = CouncilRed, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            items(uiState.availableModels, key = { it.id }) { model ->
                ModelSelectionRow(
                    model = model,
                    isSelected = uiState.selectedModels.contains(model.id),
                    isChairman = uiState.chairmanModel == model.id,
                    onToggle = { viewModel.toggleModel(model.id) },
                    onSetChairman = {
                        viewModel.setChairman(if (uiState.chairmanModel == model.id) null else model.id)
                    },
                )
            }

            // Section: Chairman
            item {
                Spacer(Modifier.height(8.dp))
                SectionHeader("Chairman Model")
                Spacer(Modifier.height(4.dp))
                Text(
                    "The chairman synthesizes all stage 1 responses into the final answer.",
                    style = MaterialTheme.typography.bodySmall,
                    color = CouncilTextMuted,
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.labelLarge,
        color = CouncilTextSecondary,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(vertical = 4.dp),
    )
}

@Composable
private fun ModelSelectionRow(
    model: CouncilModel,
    isSelected: Boolean,
    isChairman: Boolean,
    onToggle: () -> Unit,
    onSetChairman: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).clickable(onClick = onToggle),
        color = if (isSelected) CouncilCard else CouncilSurface,
        shape = RoundedCornerShape(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Checkbox(
                checked = isSelected,
                onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(
                    checkedColor = CouncilCyan,
                    uncheckedColor = CouncilBorder,
                    checkmarkColor = CouncilInk,
                ),
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    model.name.substringAfterLast("/"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = CouncilTextPrimary,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    model.id,
                    style = MaterialTheme.typography.labelSmall,
                    color = CouncilTextMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (isSelected) {
                FilterChip(
                    selected = isChairman,
                    onClick = onSetChairman,
                    label = { Text("Chairman", style = MaterialTheme.typography.labelSmall) },
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = CouncilCard,
                        labelColor = CouncilTextMuted,
                        selectedContainerColor = CouncilAmberDim,
                        selectedLabelColor = CouncilAmber,
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isChairman,
                        borderColor = CouncilBorder,
                        selectedBorderColor = CouncilAmber,
                    ),
                )
            }
        }
    }
}