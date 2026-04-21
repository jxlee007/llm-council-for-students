package com.council.app.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.council.app.data.model.Stage2Response
import com.council.app.ui.common.MarkdownText
import com.council.app.ui.theme.*

@Composable
fun Stage2Card(
    rankings: List<com.council.app.data.model.ModelRanking>,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "Peer Rankings",
            style = MaterialTheme.typography.labelLarge,
            color = CouncilPurple,
            fontWeight = FontWeight.SemiBold,
        )
        rankings.forEach { r ->
            Column {
                Text(
                    r.model.substringAfterLast("/"),
                    style = MaterialTheme.typography.labelMedium,
                    color = CouncilTextSecondary,
                    fontWeight = FontWeight.Medium,
                )
                Spacer(Modifier.height(4.dp))
                MarkdownText(markdown = r.reasoning)
            }
            HorizontalDivider(color = CouncilBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
        }
    }
}