package com.council.app.ui.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

private data class StageInfo(
    val label: String,
    val tag: String,
    val color: Color,
)

private val STAGES = listOf(
    StageInfo("Individual", "S1", CouncilAmber),
    StageInfo("Rankings",   "S2", CouncilPurple),
    StageInfo("Synthesis",  "S3", CouncilGreen),
)

/**
 * Horizontal progress indicator showing which council stage is active.
 *
 * @param activeStage One of "stage1", "stage2", "stage3", or null
 */
@Composable
fun StageFlowIndicator(
    activeStage: String?,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        STAGES.forEachIndexed { idx, stage ->
            val isActive = activeStage?.contains(stage.tag.lowercase()) == true
            val isPast = when (idx) {
                0 -> activeStage == "stage2" || activeStage == "stage3"
                1 -> activeStage == "stage3"
                else -> false
            }

            // Dot
            Box(
                modifier = Modifier
                    .size(if (isActive) 10.dp else 8.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            isActive -> stage.color
                            isPast   -> stage.color.copy(alpha = 0.5f)
                            else     -> CouncilBorder
                        }
                    )
            )

            // Label (only for active)
            AnimatedVisibility(
                visible = isActive,
                enter = expandHorizontally() + fadeIn(),
            ) {
                Text(
                    stage.label,
                    modifier = Modifier.padding(start = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = stage.color,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            // Connector line (not after last)
            if (idx < STAGES.lastIndex) {
                Box(
                    modifier = Modifier
                        .width(16.dp)
                        .height(1.dp)
                        .background(if (isPast) CouncilBorder.copy(alpha = 0.8f) else CouncilBorder.copy(alpha = 0.3f))
                )
            }
        }
    }
}
