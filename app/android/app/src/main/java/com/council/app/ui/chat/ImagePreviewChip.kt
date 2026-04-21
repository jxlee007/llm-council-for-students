package com.council.app.ui.chat

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

/**
 * Chip shown above the input bar when the user has selected an image to send.
 * Shows a thumbnail, privacy label, and a remove button.
 */
@Composable
fun ImagePreviewChip(
    bitmap: Bitmap,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(CouncilCard)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "Pending image",
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(8.dp)),
            contentScale = ContentScale.Crop,
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                "Image attached",
                style = MaterialTheme.typography.bodyMedium,
                color = CouncilTextPrimary,
            )
            Text(
                "Will be analyzed on-device · Private",
                style = MaterialTheme.typography.labelSmall,
                color = CouncilCyan,
            )
        }
        IconButton(onClick = onRemove) {
            Icon(Icons.Default.Close, "Remove image", tint = CouncilTextMuted)
        }
    }
}
