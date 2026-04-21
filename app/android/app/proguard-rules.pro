# Default ProGuard rules for CouncilApp

# Keep Kotlin metadata
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# Keep all Hilt-generated classes
-keep class dagger.hilt.** { *; }
-keep @dagger.hilt.android.HiltAndroidApp class * { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }

# Keep Realm SDK
-keep class io.realm.kotlin.** { *; }
-keep class org.mongodb.** { *; }

# Keep Ktor
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**

# Keep kotlinx.serialization
-keepattributes RuntimeVisibleAnnotations
-keep class kotlinx.serialization.** { *; }
-keep @kotlinx.serialization.Serializable class * { *; }

# Keep MediaPipe (tasks-genai 0.10.26+ R8 compatibility)
# The base wildcard rule is required; the additional rules below fix R8 stripping
# internal proto/JNI glue that 0.10.26 moved into new packages.
-keep class com.google.mediapipe.** { *; }
-dontwarn com.google.mediapipe.**
-keep class com.google.protobuf.** { *; }
-dontwarn com.google.protobuf.**
# Prevent R8 from removing native method registrations
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep DataStore
-keep class androidx.datastore.** { *; }

# Keep WorkManager
-keep class androidx.work.** { *; }

# General
-keepclassmembers class * { public static *** valueOf(java.lang.String); }
-dontnote **

# Remove logging in release
-assumenosideeffects class android.util.Log { *; }