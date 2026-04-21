package com.council.app.ui.common

import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.CouncilCyan
import com.council.app.ui.theme.CouncilTextSecondary

@Composable
fun LoadingIndicator(
    modifier: Modifier = Modifier,
    message: String = "Loading…",
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            CircularProgressIndicator(color = CouncilCyan, strokeWidth = 3.dp)
            Text(
                message,
                style = MaterialTheme.typography.bodyMedium,
                color = CouncilTextSecondary,
            )
        }
    }
}
