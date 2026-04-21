package com.council.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.council.app.ui.navigation.CouncilNavGraph
import com.council.app.ui.theme.CouncilTheme
import com.council.app.ui.theme.CouncilInk
import dagger.hilt.android.AndroidEntryPoint

/**
 * Single-activity host for the entire Compose UI.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CouncilTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = CouncilInk,
                ) {
                    CouncilNavGraph()
                }
            }
        }
    }
}
