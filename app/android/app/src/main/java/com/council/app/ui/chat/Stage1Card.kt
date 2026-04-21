package com.council.app.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.council.app.data.model.Stage1Response
import com.council.app.ui.common.MarkdownText
import com.council.app.ui.theme.*

@Composable
fun Stage1Card(
    responses: List<Stage1Response>,
    modifier: Modifier = Modifier,
) {
    var selectedModel by remember(responses) { mutableStateOf(responses.firstOrNull()?.model) }

    Column(modifier = modifier.fillMaxWidth().padding(12.dp)) {
        Text(
            "Individual Responses",
            style = MaterialTheme.typography.labelLarge,
            color = CouncilAmber,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))

        if (responses.size > 1) {
            ScrollableTabRow(
                selectedTabIndex = responses.indexOfFirst { it.model == selectedModel }.coerceAtLeast(0),
                containerColor = CouncilCard,
                edgePadding = 0.dp,
                divider = {},
            ) {
                responses.forEach { resp ->
                    Tab(
                        selected = resp.model == selectedModel,
                        onClick = { selectedModel = resp.model },
                        text = {
                            Text(
                                resp.model.substringAfterLast("/").take(18),
                                style = MaterialTheme.typography.labelMedium,
                                maxLines = 1,
                                color = if (resp.model == selectedModel) CouncilAmber else CouncilTextSecondary,
                            )
                        },
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        val shown = responses.find { it.model == selectedModel } ?: responses.firstOrNull()
        if (shown != null) {
            MarkdownText(markdown = shown.response)
        }
    }
}