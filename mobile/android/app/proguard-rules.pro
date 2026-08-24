# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
# --- Keep rules for reflection-based native libs (R8 obfuscation) ---
# React Native / Hermes / JNI
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod *; }
# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
# Expo modules (heavy reflection / Kotlin)
-keep class expo.modules.** { *; }
-keep class versioned.host.exp.exponent.** { *; }
# Firebase
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-dontwarn com.google.firebase.**
# Keep annotations / generic signatures used by JSON/reflection
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
# @generated end expo-build-properties