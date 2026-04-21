package com.council.app.ui.chat

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

/**
 * Small chip displayed on user messages that had an image analyzed on-device.
 * Makes it visually clear to the user that the image was never uploaded.
 */
@Composable
fun OnDeviceVisionBadge(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = CouncilCyanDim,
        shape = RoundedCornerShape(6.dp),
    ) {
        Text(
            "🔍  Analyzed on-device · Private",
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall,
            color = CouncilCyan,
        )
    }
}
