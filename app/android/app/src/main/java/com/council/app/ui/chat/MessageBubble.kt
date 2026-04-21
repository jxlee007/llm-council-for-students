package com.council.app.ui.chat

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.council.app.data.model.Message
import com.council.app.ui.theme.*

@Composable
fun MessageBubble(
    message: Message,
    modifier: Modifier = Modifier,
) {
    if (message.role == "user") {
        Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Column(horizontalAlignment = Alignment.End) {
                if (message.type == "image_text" && message.visionContext != null) {
                    Surface(
                        modifier = Modifier.clip(RoundedCornerShape(8.dp)),
                        color = CouncilCyanDim,
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Text(
                            "🔍 Image analyzed on-device · Private",
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = CouncilCyan,
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                }
                Surface(
                    modifier = Modifier.widthIn(max = 300.dp),
                    color = CouncilUserBubble,
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp),
                ) {
                    Text(
                        message.content,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyLarge,
                        color = CouncilTextPrimary,
                    )
                }
            }
        }
    } else {
        // CouncilResponseCard is internal in ChatScreen.kt — same package, accessible
        CouncilResponseCard(message = message)
    }
}