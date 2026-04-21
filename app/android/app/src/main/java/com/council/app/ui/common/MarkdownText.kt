package com.council.app.ui.common

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import com.council.app.ui.theme.CouncilTextPrimary

/**
 * Simple markdown renderer. Uses plain Text as fallback since the
 * mikepenz markdown library API differs from halilibo/richtext.
 * Replace with full markdown rendering once dependency API is confirmed.
 */
@Composable
fun MarkdownText(
    markdown: String,
    modifier: Modifier = Modifier,
    color: Color = CouncilTextPrimary,
    style: TextStyle = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
) {
    Text(
        text = markdown,
        modifier = modifier,
        color = color,
        style = style,
    )
}