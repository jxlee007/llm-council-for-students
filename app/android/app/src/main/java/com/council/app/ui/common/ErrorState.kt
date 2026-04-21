package com.council.app.ui.common

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

@Composable
fun ErrorState(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(
            Icons.Outlined.ErrorOutline,
            contentDescription = null,
            tint = CouncilRed,
            modifier = Modifier.size(48.dp),
        )
        Text(
            "Something went wrong",
            style = MaterialTheme.typography.titleMedium,
            color = CouncilTextPrimary,
        )
        Surface(
            color = CouncilRed.copy(alpha = 0.1f),
            shape = RoundedCornerShape(8.dp),
        ) {
            Text(
                message,
                modifier = Modifier.padding(12.dp),
                style = MaterialTheme.typography.bodySmall,
                color = CouncilRed,
            )
        }
        if (onRetry != null) {
            OutlinedButton(
                onClick = onRetry,
                shape = RoundedCornerShape(8.dp),
            ) {
                Text("Retry", color = CouncilCyan)
            }
        }
    }
}