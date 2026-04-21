package com.council.app.ui.home

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.data.model.Conversation
import com.council.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onOpenChat: (String) -> Unit,
    onNavigateConfigure: () -> Unit,
    onNavigateHistory: () -> Unit,
    onNavigatePresets: () -> Unit,
    onNavigateSettings: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val conversations by viewModel.conversations.collectAsState()
    val scope = rememberCoroutineScope()

    Scaffold(
        containerColor = CouncilInk,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Council",
                        fontWeight = FontWeight.ExtraBold,
                        color = CouncilCyan,
                    )
                },
                actions = {
                    IconButton(onClick = onNavigateHistory) {
                        Icon(Icons.Outlined.History, "History", tint = CouncilTextSecondary)
                    }
                    IconButton(onClick = onNavigateSettings) {
                        Icon(Icons.Outlined.Settings, "Settings", tint = CouncilTextSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
        bottomBar = {
            NavigationBar(containerColor = CouncilSurface, tonalElevation = 0.dp) {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Outlined.Forum, "Chats") },
                    label = { Text("Chats") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CouncilCyan,
                        selectedTextColor = CouncilCyan,
                        unselectedIconColor = CouncilTextSecondary,
                        indicatorColor = CouncilCyanDim,
                    ),
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateConfigure,
                    icon = { Icon(Icons.Outlined.Tune, "Configure") },
                    label = { Text("Configure") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CouncilCyan,
                        unselectedIconColor = CouncilTextSecondary,
                        indicatorColor = CouncilCyanDim,
                    ),
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigatePresets,
                    icon = { Icon(Icons.Outlined.Bookmarks, "Presets") },
                    label = { Text("Presets") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CouncilCyan,
                        unselectedIconColor = CouncilTextSecondary,
                        indicatorColor = CouncilCyanDim,
                    ),
                )
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    scope.launch {
                        val newId = viewModel.newConversation()
                        onOpenChat(newId)
                    }
                },
                containerColor = CouncilCyan,
                contentColor = CouncilInk,
                shape = RoundedCornerShape(16.dp),
            ) {
                Icon(Icons.Default.Add, "New conversation")
            }
        },
    ) { padding ->
        if (conversations.isEmpty()) {
            EmptyConversationsState(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                onNewChat = {
                    scope.launch {
                        val id = viewModel.newConversation()
                        onOpenChat(id)
                    }
                },
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(conversations, key = { it.id }) { conv ->
                    ConversationCard(
                        conversation = conv,
                        onClick = { onOpenChat(conv.id) },
                        onDelete = { viewModel.deleteConversation(conv.id) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ConversationCard(
    conversation: Conversation,
    onClick: () -> Unit,
    onDelete: () -> Unit,
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Conversation?") },
            text = { Text("This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = { showDeleteDialog = false; onDelete() }) {
                    Text("Delete", color = CouncilRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel", color = CouncilTextSecondary)
                }
            },
            containerColor = CouncilCard,
        )
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = CouncilSurface),
        shape = RoundedCornerShape(12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(CouncilCyanDim),
                contentAlignment = Alignment.Center,
            ) {
                Text("🏛️", style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    conversation.title.ifBlank { "New Conversation" },
                    style = MaterialTheme.typography.titleSmall,
                    color = CouncilTextPrimary,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    formatTimestamp(conversation.lastMessageAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = CouncilTextMuted,
                )
            }
            IconButton(onClick = { showDeleteDialog = true }) {
                Icon(Icons.Default.Delete, "Delete", tint = CouncilTextMuted, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun EmptyConversationsState(modifier: Modifier = Modifier, onNewChat: () -> Unit) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("🏛️", style = MaterialTheme.typography.displayLarge)
        Spacer(Modifier.height(16.dp))
        Text(
            "No conversations yet",
            style = MaterialTheme.typography.titleMedium,
            color = CouncilTextPrimary,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Start one to ask the AI council anything",
            style = MaterialTheme.typography.bodyMedium,
            color = CouncilTextSecondary,
        )
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onNewChat,
            colors = ButtonDefaults.buttonColors(containerColor = CouncilCyan, contentColor = CouncilInk),
            shape = RoundedCornerShape(12.dp),
        ) {
            Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("New Conversation", fontWeight = FontWeight.SemiBold)
        }
    }
}

private fun formatTimestamp(ms: Long): String {
    val sdf = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
    return sdf.format(Date(ms))
}
