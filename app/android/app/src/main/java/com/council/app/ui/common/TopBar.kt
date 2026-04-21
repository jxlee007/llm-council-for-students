package com.council.app.ui.common

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import com.council.app.ui.theme.CouncilSurface
import com.council.app.ui.theme.CouncilTextPrimary
import com.council.app.ui.theme.CouncilTextSecondary

/**
 * Reusable top app bar for secondary screens (detail, settings, etc.).
 *
 * @param title Screen title
 * @param onNavigateUp Back navigation callback; if null, the back button is hidden
 * @param actions Optional trailing icon buttons
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CouncilTopBar(
    title: String,
    subtitle: String? = null,
    onNavigateUp: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    TopAppBar(
        navigationIcon = {
            if (onNavigateUp != null) {
                IconButton(onClick = onNavigateUp) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = CouncilTextSecondary)
                }
            }
        },
        title = {
            if (subtitle != null) {
                androidx.compose.foundation.layout.Column {
                    Text(title, color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
                    Text(subtitle, style = MaterialTheme.typography.labelSmall, color = CouncilTextSecondary)
                }
            } else {
                Text(title, color = CouncilTextPrimary, fontWeight = FontWeight.SemiBold)
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = CouncilSurface),
    )
}