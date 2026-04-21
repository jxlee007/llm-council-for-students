package com.council.app.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AttachFile
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.council.app.ui.theme.*

/**
 * Chat input bar with attach button, multi-line text field, and send button.
 *
 * @param text The current input text
 * @param onTextChange Called when the user edits the text
 * @param disabled True while the council is processing
 * @param onAttach Called when the user taps the attach (📎) button
 * @param onSend Called when the user taps send
 */
@Composable
fun BottomInputBar(
    text: String,
    onTextChange: (String) -> Unit,
    disabled: Boolean,
    onAttach: () -> Unit,
    onSend: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(CouncilSurface)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        IconButton(onClick = onAttach, enabled = !disabled) {
            Icon(
                Icons.Outlined.AttachFile, "Attach image",
                tint = if (!disabled) CouncilTextSecondary else CouncilTextMuted,
            )
        }

        OutlinedTextField(
            value = text,
            onValueChange = onTextChange,
            modifier = Modifier.weight(1f),
            placeholder = { Text("Ask the council…", color = CouncilTextMuted) },
            maxLines = 5,
            enabled = !disabled,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor   = CouncilCard,
                unfocusedContainerColor = CouncilCard,
                focusedBorderColor      = CouncilBorder,
                unfocusedBorderColor    = CouncilBorder,
                focusedTextColor        = CouncilTextPrimary,
                unfocusedTextColor      = CouncilTextPrimary,
                disabledContainerColor  = CouncilCard,
                disabledBorderColor     = CouncilBorder,
                disabledTextColor       = CouncilTextMuted,
            ),
            shape = RoundedCornerShape(12.dp),
        )

        val canSend = !disabled && text.isNotBlank()
        IconButton(
            onClick = onSend,
            enabled = canSend,
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(if (canSend) CouncilCyan else CouncilCard),
        ) {
            Icon(
                Icons.AutoMirrored.Filled.Send, "Send",
                tint = if (canSend) CouncilInk else CouncilTextMuted,
            )
        }
    }
}