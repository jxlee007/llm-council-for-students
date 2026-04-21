package com.council.app.ui.configure

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.council.app.data.model.CouncilModel
import com.council.app.ui.theme.*

/**
 * Bottom sheet for selecting council member models.
 *
 * @param allModels All available models from the API
 * @param selectedIds Currently selected model IDs
 * @param chairmanId Currently selected chairman model ID
 * @param onToggleModel Called when a model checkbox is toggled
 * @param onSetChairman Called when a model is set as chairman
 * @param onDismiss Called when the sheet should close
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModelPickerSheet(
    allModels: List<CouncilModel>,
    selectedIds: Set<String>,
    chairmanId: String?,
    onToggleModel: (String) -> Unit,
    onSetChairman: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = CouncilSurface,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 8.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .background(CouncilBorder, RoundedCornerShape(2.dp))
            )
        }
    ) {
        Column(modifier = Modifier.fillMaxHeight(0.85f)) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Select Council Members",
                    style = MaterialTheme.typography.titleMedium,
                    color = CouncilTextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "${selectedIds.size} selected",
                    style = MaterialTheme.typography.labelMedium,
                    color = CouncilCyan,
                )
            }
            HorizontalDivider(color = CouncilBorder, thickness = 0.5.dp)

            if (allModels.isEmpty()) {
                Box(
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = CouncilCyan)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(bottom = 24.dp),
                ) {
                    items(allModels, key = { it.id }) { model ->
                        ModelRow(
                            model = model,
                            isSelected = model.id in selectedIds,
                            isChairman = model.id == chairmanId,
                            onToggle = { onToggleModel(model.id) },
                            onSetChairman = { onSetChairman(model.id) },
                        )
                    }
                }
            }

            // Confirm
            Button(
                onClick = onDismiss,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Done", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun ModelRow(
    model: CouncilModel,
    isSelected: Boolean,
    isChairman: Boolean,
    onToggle: () -> Unit,
    onSetChairman: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .padding(horizontal = 20.dp, vertical = 12.dp),
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
            )
            Text(
                model.name.substringBefore("/"),
                style = MaterialTheme.typography.labelSmall,
                color = CouncilTextSecondary,
            )
        }
        AnimatedVisibility(visible = isSelected) {
            IconButton(onClick = onSetChairman) {
                Icon(
                    Icons.Default.Star,
                    "Set as chairman",
                    tint = if (isChairman) CouncilAmber else CouncilTextMuted,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
    HorizontalDivider(
        modifier = Modifier.padding(start = 76.dp),
        color = CouncilBorder.copy(alpha = 0.5f),
        thickness = 0.5.dp,
    )
}
