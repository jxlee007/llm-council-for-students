package com.council.app.di

import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import com.council.app.BuildConfig
import com.council.app.data.db.RealmConversation
import com.council.app.data.db.RealmMessage
import com.council.app.data.db.RealmUser
import com.council.app.data.remote.CouncilApiClient
import com.council.app.data.repository.SettingsRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.ktor.client.HttpClient
import io.realm.kotlin.Realm
import io.realm.kotlin.mongodb.App
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "council_settings")

/**
 * Main Hilt module. Provides:
 * - Atlas App ([App]) for authentication
 * - [Realm] with Atlas Device Sync for data persistence
 * - [HttpClient] (Ktor) for API/SSE calls
 * - [DataStore] for preferences
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAtlasApp(): App {
        val appId = BuildConfig.ATLAS_APP_ID
        check(appId.isNotBlank() && appId != "your-atlas-app-id") {
            """
            ╔══════════════════════════════════════════════════════════════════╗
            ║  ATLAS_APP_ID is not configured!                                ║
            ║                                                                  ║
            ║  1. Go to https://www.mongodb.com/atlas and create a free        ║
            ║     cluster with App Services + email/password auth enabled.     ║
            ║  2. Copy your App ID (e.g. "myapp-abcde") from App Services.    ║
            ║  3. Open local.properties (project root) and set:               ║
            ║       ATLAS_APP_ID=<your-actual-app-id>                         ║
            ║  4. Clean & rebuild the project.                                 ║
            ╚══════════════════════════════════════════════════════════════════╝
            """.trimIndent()
        }
        return App.create(appId)
    }

    @Provides
    @Singleton
    fun provideRealm(app: App): Realm {
        // NOTE: Atlas Device Sync requires the user to be logged in before opening a synced Realm.
        // We open a local-only realm for now; the repository layer upgrades to synced realm after login.
        // For a production app, open SyncConfiguration tied to the current user.
        val config = io.realm.kotlin.RealmConfiguration.Builder(
            schema = setOf(RealmConversation::class, RealmMessage::class, RealmUser::class)
        )
            .schemaVersion(1)
            .build()
        return Realm.open(config)
    }

    @Provides
    @Singleton
    fun provideHttpClient(): HttpClient = CouncilApiClient.build()

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }
}