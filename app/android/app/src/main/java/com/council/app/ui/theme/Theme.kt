package com.council.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary           = CouncilCyan,
    onPrimary         = CouncilInk,
    primaryContainer  = CouncilCard,
    secondary         = CouncilAmber,
    secondaryContainer = CouncilAmberDim,
    tertiary          = CouncilGreen,
    background        = CouncilInk,
    surface           = CouncilSurface,
    surfaceVariant    = CouncilCard,
    onBackground      = CouncilTextPrimary,
    onSurface         = CouncilTextPrimary,
    onSurfaceVariant  = CouncilTextSecondary,
    outline           = CouncilBorder,
    error             = CouncilRed,
    onError           = CouncilTextPrimary,
)

@Composable
fun CouncilTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = CouncilTypography,
        content = content,
    )
}
