package com.council.app.ui.theme

import androidx.compose.ui.graphics.Color

// ── Base dark palette (extended from QwenVisionApp) ──────────────────────────

val CouncilInk         = Color(0xFF0D1117)  // darkest background
val CouncilSurface     = Color(0xFF161B22)  // cards / surfaces
val CouncilCard        = Color(0xFF1C222A)  // elevated cards
val CouncilBorder      = Color(0xFF30363D)  // borders / dividers

val CouncilTextPrimary   = Color(0xFFE6EDF3)
val CouncilTextSecondary = Color(0xFF8B949E)
val CouncilTextMuted     = Color(0xFF484F58)

// ── Council accent colours ────────────────────────────────────────────────────

val CouncilAmber   = Color(0xFFF0B429)  // Stage 1 — individual responses
val CouncilPurple  = Color(0xFF9B59B6)  // Stage 2 — peer rankings
val CouncilGreen   = Color(0xFF2ECC71)  // Stage 3 — final synthesis
val CouncilCyan    = Color(0xFF58A6FF)  // links / interactive elements
val CouncilRed     = Color(0xFFFF5555)  // errors

// Dimmed variants for backgrounds
val CouncilAmberDim  = Color(0xFFF0B429).copy(alpha = 0.15f)
val CouncilPurpleDim = Color(0xFF9B59B6).copy(alpha = 0.15f)
val CouncilGreenDim  = Color(0xFF2ECC71).copy(alpha = 0.15f)
val CouncilCyanDim   = Color(0xFF58A6FF).copy(alpha = 0.15f)

// ── Chat bubble backgrounds ───────────────────────────────────────────────────

val CouncilUserBubble  = Color(0xFF1F2D3D)
val CouncilAgentBubble = Color(0xFF1C222A)
