package com.council.app.ui.common

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

/**
 * Animated loading indicator that shows the 3 council stages pulsing in sequence.
 * Used in the chat screen while the council is processing.
 */
@Composable
fun CouncilLoader(
    modifier: Modifier = Modifier,
    label: String = "Council is deliberating…",
    dotSize: Dp = 10.dp,
) {
    val dots = listOf(
        CouncilAmber  to "S1",
        CouncilPurple to "S2",
        CouncilGreen  to "S3",
    )

    val infiniteTransition = rememberInfiniteTransition(label = "council_loader")

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            dots.forEachIndexed { index, (color, stageLabel) ->
                val scale by infiniteTransition.animateFloat(
                    initialValue = 0.7f,
                    targetValue = 1.2f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(
                            durationMillis = 600,
                            easing = FastOutSlowInEasing,
                        ),
                        repeatMode = RepeatMode.Reverse,
                        initialStartOffset = StartOffset(index * 200),
                    ),
                    label = "dot_scale_$index",
                )
                Surface(
                    modifier = Modifier.size(dotSize).scale(scale),
                    shape = CircleShape,
                    color = color,
                ) {}
            }
        }
        Text(
            label,
            style = MaterialTheme.typography.bodySmall,
            color = CouncilTextSecondary,
            fontWeight = FontWeight.Medium,
        )
    }
}
