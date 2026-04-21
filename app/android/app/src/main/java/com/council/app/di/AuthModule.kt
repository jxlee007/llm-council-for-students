package com.council.app.di

import com.council.app.data.repository.AuthRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.realm.kotlin.mongodb.App
import javax.inject.Singleton

/**
 * Hilt module providing Atlas App Services auth dependencies.
 * The [App] instance is provided by [AppModule]; [AuthRepository] wraps it.
 */
@Module
@InstallIn(SingletonComponent::class)
object AuthModule {

    @Provides
    @Singleton
    fun provideAuthRepository(atlasApp: App): AuthRepository {
        return AuthRepository(atlasApp)
    }
}
