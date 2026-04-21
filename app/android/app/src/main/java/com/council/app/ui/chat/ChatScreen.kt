package com.council.app.ui.chat

import android.graphics.Bitmap
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.data.model.Message
import com.council.app.data.model.Stage1Response
import com.council.app.data.model.Stage2Response
import com.council.app.data.model.Stage3Response
import com.council.app.ui.common.MarkdownText
import com.council.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    conversationId: String,
    onNavigateUp: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel(),
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    var inputText by remember { mutableStateOf("") }
    var pendingBitmap by remember { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(conversationId) { viewModel.loadConversation(conversationId) }
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    val imagePickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { pendingBitmap = loadBitmapFromUri(context, uri) }
    }

    Scaffold(
        containerColor = CouncilInk,
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onNavigateUp) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = CouncilTextSecondary)
                    }
                },
                title = {
                    Column {
                        Text(
                            uiState.title.ifBlank { "Council" },
                            style = MaterialTheme.typography.titleMedium,
                            color = CouncilTextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                        )
                        if (uiState.processing) {
                            Text(
                                uiState.statusLabel,
                                style = MaterialTheme.typography.labelSmall,
                                color = CouncilAmber,
                            )
                        }
                    }
                },
                actions = {
                    if (uiState.processing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp).padding(end = 8.dp),
                            color = CouncilAmber,
                            strokeWidth = 2.dp,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
        snackbarHost = {
            val snackbarHostState = remember { SnackbarHostState() }
            LaunchedEffect(uiState.errorMessage) {
                if (uiState.errorMessage != null) {
                    snackbarHostState.showSnackbar(uiState.errorMessage!!)
                    viewModel.clearError()
                }
            }
            SnackbarHost(hostState = snackbarHostState)
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (messages.isEmpty() && !uiState.processing) {
                    item { EmptyChat() }
                }
                items(messages, key = { it.id }) { msg -> MessageRow(message = msg) }
            }

            AnimatedVisibility(visible = pendingBitmap != null) {
                PendingImageBar(bitmap = pendingBitmap, onRemove = { pendingBitmap = null })
            }

            HorizontalDivider(color = CouncilBorder, thickness = 0.5.dp)

            InputBar(
                text = inputText,
                onTextChange = { inputText = it },
                disabled = uiState.processing,
                onAttach = { imagePickerLauncher.launch("image/*") },
                onSend = {
                    if (inputText.isNotBlank() || pendingBitmap != null) {
                        val text = inputText
                        val bmp = pendingBitmap
                        inputText = ""
                        pendingBitmap = null
                        viewModel.sendMessage(
                            context = context,
                            conversationId = conversationId,
                            userText = text,
                            pendingImage = bmp,
                        )
                        scope.launch { listState.animateScrollToItem(messages.size) }
                    }
                },
            )
        }
    }
}

@Composable
private fun MessageRow(message: Message) {
    if (message.role == "user") {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
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
        CouncilResponseCard(message = message)
    }
}

// internal so MessageBubble.kt can also call it
@Composable
internal fun CouncilResponseCard(message: Message) {
    if (message.processing && message.stage1 == null) {
        Surface(
            color = CouncilCard,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = CouncilAmber, strokeWidth = 2.dp)
                Text(
                    message.statusLabel,
                    style = MaterialTheme.typography.bodyMedium,
                    color = CouncilTextSecondary,
                )
            }
        }
        return
    }

    if (message.error != null) {
        Surface(
            color = CouncilRed.copy(alpha = 0.10f),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Icons.Outlined.ErrorOutline, null, tint = CouncilRed, modifier = Modifier.size(18.dp))
                Text(message.error, style = MaterialTheme.typography.bodyMedium, color = CouncilRed)
            }
        }
        return
    }

    var selectedTab by remember { mutableStateOf(if (message.stage3 != null) 2 else 0) }

    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(CouncilCard)
    ) {
        val hasSt1 = message.stage1 != null
        val hasSt2 = message.stage2 != null
        val hasSt3 = message.stage3 != null

        Row(
            modifier = Modifier.fillMaxWidth().background(CouncilSurface).padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            StageTabChip("S1", CouncilAmber, hasSt1, selectedTab == 0) { if (hasSt1) selectedTab = 0 }
            StageTabChip("S2", CouncilPurple, hasSt2, selectedTab == 1) { if (hasSt2) selectedTab = 1 }
            StageTabChip("S3", CouncilGreen, hasSt3, selectedTab == 2) { if (hasSt3) selectedTab = 2 }
            if (message.processing) {
                Spacer(Modifier.weight(1f))
                CircularProgressIndicator(modifier = Modifier.size(14.dp), color = CouncilAmber, strokeWidth = 2.dp)
            }
        }

        Crossfade(targetState = selectedTab) { tab ->
            when (tab) {
                0 -> Stage1Content(message.stage1 ?: emptyList())
                1 -> Stage2Content(message.stage2?.rankings ?: emptyList())
                2 -> Stage3Content(message.stage3)
            }
        }
    }
}

/** Helper so Message doesn't need a currentStage field */
private val Message.statusLabel: String
    get() = when {
        processing && stage1 == null -> "Gathering individual responses…"
        processing && stage2 == null -> "Comparing and ranking responses…"
        processing && stage3 == null -> "Synthesizing final answer…"
        else -> "Processing…"
    }

@Composable
private fun StageTabChip(
    label: String,
    color: androidx.compose.ui.graphics.Color,
    available: Boolean,
    selected: Boolean,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, style = MaterialTheme.typography.labelMedium) },
        enabled = available,
        colors = FilterChipDefaults.filterChipColors(
            containerColor = CouncilCard,
            labelColor = CouncilTextMuted,
            selectedContainerColor = color.copy(alpha = 0.2f),
            selectedLabelColor = color,
            disabledContainerColor = CouncilCard,
            disabledLabelColor = CouncilTextMuted.copy(alpha = 0.4f),
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = available,
            selected = selected,
            borderColor = CouncilBorder,
            selectedBorderColor = color,
        ),
    )
}

@Composable
private fun Stage1Content(responses: List<Stage1Response>) {
    var selectedModel by remember(responses) { mutableStateOf(responses.firstOrNull()?.model) }
    Column(modifier = Modifier.padding(12.dp)) {
        if (responses.size > 1) {
            ScrollableTabRow(
                selectedTabIndex = responses.indexOfFirst { it.model == selectedModel }.coerceAtLeast(0),
                containerColor = CouncilCard,
                edgePadding = 0.dp,
                divider = {},
            ) {
                responses.forEachIndexed { _, resp ->
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
        val selected = responses.find { it.model == selectedModel } ?: responses.firstOrNull()
        if (selected != null) {
            MarkdownText(markdown = selected.response)
        }
    }
}

@Composable
private fun Stage2Content(rankings: List<com.council.app.data.model.ModelRanking>) {
    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Peer Rankings", style = MaterialTheme.typography.labelLarge, color = CouncilPurple, fontWeight = FontWeight.SemiBold)
        rankings.forEach { r ->
            Column {
                Text(r.model.substringAfterLast("/"), style = MaterialTheme.typography.labelMedium, color = CouncilTextSecondary)
                Spacer(Modifier.height(4.dp))
                MarkdownText(markdown = r.reasoning)
            }
            HorizontalDivider(color = CouncilBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
        }
    }
}

@Composable
private fun Stage3Content(response: Stage3Response?) {
    if (response == null) {
        Box(modifier = Modifier.padding(16.dp)) { Text("Synthesis pending…", color = CouncilTextMuted) }
        return
    }
    Column(modifier = Modifier.padding(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(CouncilGreen))
            Text("Final Synthesis", style = MaterialTheme.typography.labelLarge, color = CouncilGreen, fontWeight = FontWeight.SemiBold)
            Text("by ${response.model.substringAfterLast("/")}", style = MaterialTheme.typography.labelSmall, color = CouncilTextMuted)
        }
        Spacer(Modifier.height(8.dp))
        MarkdownText(markdown = response.response)
    }
}

@Composable
private fun InputBar(
    text: String,
    onTextChange: (String) -> Unit,
    disabled: Boolean,
    onAttach: () -> Unit,
    onSend: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().background(CouncilSurface).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        IconButton(onClick = onAttach, enabled = !disabled) {
            Icon(Icons.Outlined.AttachFile, "Attach", tint = if (!disabled) CouncilTextSecondary else CouncilTextMuted)
        }
        OutlinedTextField(
            value = text,
            onValueChange = onTextChange,
            modifier = Modifier.weight(1f),
            placeholder = { Text("Type a message…", color = CouncilTextMuted) },
            maxLines = 5,
            enabled = !disabled,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = CouncilCard,
                unfocusedContainerColor = CouncilCard,
                focusedBorderColor = CouncilBorder,
                unfocusedBorderColor = CouncilBorder,
                focusedTextColor = CouncilTextPrimary,
                unfocusedTextColor = CouncilTextPrimary,
            ),
            shape = RoundedCornerShape(12.dp),
        )
        IconButton(
            onClick = onSend,
            enabled = !disabled && text.isNotBlank(),
            modifier = Modifier.size(44.dp).clip(CircleShape)
                .background(if (!disabled && text.isNotBlank()) CouncilCyan else CouncilCard),
        ) {
            Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = if (!disabled && text.isNotBlank()) CouncilInk else CouncilTextMuted)
        }
    }
}

@Composable
private fun PendingImageBar(bitmap: Bitmap?, onRemove: () -> Unit) {
    if (bitmap == null) return
    Row(
        modifier = Modifier.fillMaxWidth().background(CouncilCard).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = null,
            modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)),
            contentScale = ContentScale.Crop,
        )
        Column(modifier = Modifier.weight(1f)) {
            Text("Image attached", style = MaterialTheme.typography.bodyMedium, color = CouncilTextPrimary)
            Text("Will be analyzed on-device", style = MaterialTheme.typography.labelSmall, color = CouncilCyan)
        }
        IconButton(onClick = onRemove) {
            Icon(Icons.Default.Close, "Remove", tint = CouncilTextMuted)
        }
    }
}

@Composable
private fun EmptyChat() {
    Column(
        modifier = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("🏛️", style = MaterialTheme.typography.displayMedium)
        Text("The council is assembled", style = MaterialTheme.typography.titleMedium, color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
        Text(
            "Ask anything. Multiple AI models will debate and synthesize the best answer.",
            style = MaterialTheme.typography.bodyMedium,
            color = CouncilTextSecondary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

private fun loadBitmapFromUri(context: android.content.Context, uri: Uri): Bitmap? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri) ?: return null
        android.graphics.BitmapFactory.decodeStream(inputStream)
    } catch (e: Exception) { null }
}