package com.council.app.ui.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Memory
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.council.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateUp: () -> Unit,
    onNavigateToVisionModels: () -> Unit,
    onSignedOut: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
    authViewModel: com.council.app.ui.auth.AuthViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()
    var apiUrlEdit by remember(uiState.apiUrl) { mutableStateOf(uiState.apiUrl) }
    var apiKeyEdit by remember { mutableStateOf("") }
    var showKey by remember { mutableStateOf(false) }
    var showSignOutDialog by remember { mutableStateOf(false) }

    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            title = { Text("Sign Out?") },
            text = { Text("You'll need to sign back in to use Council.") },
            confirmButton = {
                TextButton(onClick = {
                    showSignOutDialog = false
                    authViewModel.signOut(onSignedOut)
                }) { Text("Sign Out", color = CouncilRed) }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) {
                    Text("Cancel", color = CouncilTextSecondary)
                }
            },
            containerColor = CouncilCard,
        )
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
                    Text("Settings", color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // ── API Server ────────────────────────────────────────────────────
            item {
                SettingsSection(title = "API Server") {
                    OutlinedTextField(
                        value = apiUrlEdit,
                        onValueChange = { apiUrlEdit = it },
                        label = { Text("Server URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("http://10.0.2.2:8001", color = CouncilTextMuted) },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done,
                        ),
                        colors = textFieldColors(),
                        shape = RoundedCornerShape(12.dp),
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { viewModel.setApiUrl(apiUrlEdit) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CouncilCyan,
                                contentColor = CouncilInk,
                            ),
                            shape = RoundedCornerShape(8.dp),
                        ) { Text("Save") }
                        OutlinedButton(
                            onClick = viewModel::testConnection,
                            enabled = uiState.connectionStatus != ConnectionStatus.TESTING,
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, CouncilBorder),
                        ) {
                            if (uiState.connectionStatus == ConnectionStatus.TESTING) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(14.dp),
                                    strokeWidth = 2.dp,
                                    color = CouncilCyan,
                                )
                            } else {
                                Text("Test Connection", color = CouncilTextSecondary)
                            }
                        }
                    }
                    when (uiState.connectionStatus) {
                        ConnectionStatus.SUCCESS ->
                            Text("✓ Connection OK", color = CouncilGreen, style = MaterialTheme.typography.labelMedium)
                        ConnectionStatus.FAILED ->
                            Text("✗ Connection failed", color = CouncilRed, style = MaterialTheme.typography.labelMedium)
                        else -> {}
                    }
                }
            }

            // ── OpenRouter API Key ────────────────────────────────────────────
            item {
                SettingsSection(title = "OpenRouter API Key") {
                    if (uiState.hasApiKey) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("API key saved ✓", color = CouncilGreen, style = MaterialTheme.typography.bodyMedium)
                            TextButton(onClick = viewModel::clearKey) {
                                Text("Clear", color = CouncilRed, style = MaterialTheme.typography.labelMedium)
                            }
                        }
                    } else {
                        OutlinedTextField(
                            value = apiKeyEdit,
                            onValueChange = { apiKeyEdit = it },
                            label = { Text("sk-or-…") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            visualTransformation = if (showKey) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                TextButton(onClick = { showKey = !showKey }) {
                                    Text(
                                        if (showKey) "Hide" else "Show",
                                        color = CouncilTextMuted,
                                        style = MaterialTheme.typography.labelSmall,
                                    )
                                }
                            },
                            colors = textFieldColors(),
                            shape = RoundedCornerShape(12.dp),
                        )
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = { viewModel.saveKey(apiKeyEdit); apiKeyEdit = "" },
                            enabled = apiKeyEdit.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CouncilCyan,
                                contentColor = CouncilInk,
                            ),
                            shape = RoundedCornerShape(8.dp),
                        ) { Text("Save Key") }
                    }
                }
            }

            // ── Vision Models ─────────────────────────────────────────────────
            item {
                SettingsSection(title = "On-Device Vision") {
                    Text(
                        "Manage Qwen2.5-VL models for on-device image analysis.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CouncilTextSecondary,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = onNavigateToVisionModels,
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, CouncilCyan.copy(alpha = 0.5f)),
                    ) {
                        Icon(Icons.Outlined.Memory, null, modifier = Modifier.size(16.dp), tint = CouncilCyan)
                        Spacer(Modifier.width(6.dp))
                        Text("Manage Vision Models", color = CouncilCyan)
                    }
                }
            }

            // ── Account ───────────────────────────────────────────────────────
            item {
                SettingsSection(title = "Account") {
                    uiState.userEmail?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = CouncilTextSecondary)
                        Spacer(Modifier.height(8.dp))
                    }
                    OutlinedButton(
                        onClick = { showSignOutDialog = true },
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, CouncilRed.copy(alpha = 0.5f)),
                    ) {
                        Icon(Icons.AutoMirrored.Outlined.Logout, null, modifier = Modifier.size(16.dp), tint = CouncilRed)
                        Spacer(Modifier.width(6.dp))
                        Text("Sign Out", color = CouncilRed)
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Surface(
        color = CouncilSurface,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                title,
                style = MaterialTheme.typography.labelLarge,
                color = CouncilTextSecondary,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun textFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = CouncilCard,
    unfocusedContainerColor = CouncilCard,
    focusedBorderColor = CouncilCyan,
    unfocusedBorderColor = CouncilBorder,
    focusedLabelColor = CouncilCyan,
    unfocusedLabelColor = CouncilTextSecondary,
    focusedTextColor = CouncilTextPrimary,
    unfocusedTextColor = CouncilTextPrimary,
)