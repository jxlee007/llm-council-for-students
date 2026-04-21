package com.council.app.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.council.app.data.model.Stage3Response
import com.council.app.ui.common.MarkdownText
import com.council.app.ui.theme.*

@Composable
fun Stage3Card(
    response: Stage3Response?,
    modifier: Modifier = Modifier,
) {
    if (response == null) {
        Box(modifier = modifier.padding(16.dp)) {
            Text("Synthesis pending…", color = CouncilTextMuted, style = MaterialTheme.typography.bodyMedium)
        }
        return
    }

    Column(modifier = modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Box(
                modifier = Modifier.size(6.dp).clip(CircleShape).background(CouncilGreen)
            )
            Text(
                "Final Synthesis",
                style = MaterialTheme.typography.labelLarge,
                color = CouncilGreen,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                "by ${response.model.substringAfterLast("/")}",
                style = MaterialTheme.typography.labelSmall,
                color = CouncilTextMuted,
            )
        }
        Spacer(Modifier.height(8.dp))
        MarkdownText(markdown = response.response)
    }
}
