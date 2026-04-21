package com.council.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.council.app.data.repository.AuthState
import com.council.app.ui.auth.AuthViewModel
import com.council.app.ui.auth.ForgotPasswordScreen
import com.council.app.ui.auth.SignInScreen
import com.council.app.ui.auth.SignUpScreen
import com.council.app.ui.chat.ChatScreen
import com.council.app.ui.configure.ConfigureScreen
import com.council.app.ui.history.HistoryScreen
import com.council.app.ui.home.HomeScreen
import com.council.app.ui.presets.PresetsScreen
import com.council.app.ui.settings.SettingsScreen
import com.council.app.ui.qwenvision.VisionModelsScreen

object Routes {
    const val SIGN_IN      = "sign_in"
    const val SIGN_UP      = "sign_up"
    const val FORGOT_PW    = "forgot_password"
    const val HOME         = "home"
    const val CHAT         = "chat/{conversationId}"
    const val HISTORY      = "history"
    const val CONFIGURE    = "configure"
    const val PRESETS      = "presets"
    const val SETTINGS     = "settings"
    const val VISION_MODELS = "vision_models"

    fun chat(conversationId: String) = "chat/$conversationId"
}

@Composable
fun CouncilNavGraph(
    navController: NavHostController = rememberNavController(),
) {
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.authState.collectAsState()

    val startDest = when (authState) {
        is AuthState.LoggedIn -> Routes.HOME
        else -> Routes.SIGN_IN
    }

    NavHost(
        navController = navController,
        startDestination = startDest,
    ) {
        // ── Auth ─────────────────────────────────────────────────────────────

        composable(Routes.SIGN_IN) {
            SignInScreen(
                onSignedIn = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.SIGN_IN) { inclusive = true }
                    }
                },
                onNavigateToSignUp = { navController.navigate(Routes.SIGN_UP) },
                onNavigateToForgotPassword = { navController.navigate(Routes.FORGOT_PW) },
            )
        }

        composable(Routes.SIGN_UP) {
            SignUpScreen(
                onSignedUp = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.SIGN_IN) { inclusive = true }
                    }
                },
                onNavigateToSignIn = { navController.popBackStack() },
            )
        }

        composable(Routes.FORGOT_PW) {
            ForgotPasswordScreen(
                onBack = { navController.popBackStack() },
            )
        }

        // ── Main ─────────────────────────────────────────────────────────────

        composable(Routes.HOME) {
            HomeScreen(
                onOpenChat = { convId -> navController.navigate(Routes.chat(convId)) },
                onNavigateConfigure = { navController.navigate(Routes.CONFIGURE) },
                onNavigateHistory = { navController.navigate(Routes.HISTORY) },
                onNavigatePresets = { navController.navigate(Routes.PRESETS) },
                onNavigateSettings = { navController.navigate(Routes.SETTINGS) },
            )
        }

        composable(
            route = Routes.CHAT,
            arguments = listOf(navArgument("conversationId") { type = NavType.StringType }),
        ) { backStack ->
            val convId = backStack.arguments?.getString("conversationId") ?: return@composable
            ChatScreen(
                conversationId = convId,
                onNavigateUp = { navController.popBackStack() },
            )
        }

        composable(Routes.HISTORY) {
            HistoryScreen(
                onOpenChat = { convId -> navController.navigate(Routes.chat(convId)) },
                onNavigateUp = { navController.popBackStack() },
            )
        }

        composable(Routes.CONFIGURE) {
            ConfigureScreen(
                onNavigateUp = { navController.popBackStack() },
            )
        }

        composable(Routes.PRESETS) {
            PresetsScreen(
                onNavigateUp = { navController.popBackStack() },
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onNavigateUp = { navController.popBackStack() },
                onNavigateToVisionModels = { navController.navigate(Routes.VISION_MODELS) },
                onSignedOut = {
                    navController.navigate(Routes.SIGN_IN) {
                        popUpTo(Routes.HOME) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.VISION_MODELS) {
            VisionModelsScreen(
                onNavigateUp = { navController.popBackStack() },
            )
        }
    }
}
