package com.anonymous.test

import android.util.Log;

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.soloader.OpenSourceMergedSoMapping

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.soloader.SoLoader

import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

import com.myproject.HandLandmarksPackage
import com.anonymous.test.handlandmarksframeprocessor.HandLandmarksFrameProcessorPluginPackage

import com.myproject.PoseDetectionPackage
import com.anonymous.test.posedetectionframeprocessor.PoseDetectionFrameProcessorPluginPackage

class MainApplication : Application(), ReactApplication {
 
  override val reactNativeHost: ReactNativeHost =
            object : DefaultReactNativeHost(this) {
                override fun getPackages(): List<ReactPackage> {
                    val packages = PackageList(this).packages.toMutableList()
                    // Add the HandLandmarksFrameProcessorPluginPackage manually
                    packages.add(HandLandmarksFrameProcessorPluginPackage())
                    packages.add(HandLandmarksPackage())
                    packages.add(PoseDetectionFrameProcessorPluginPackage())
                    packages.add(PoseDetectionPackage())
                    Log.i("packageGeneration", "registration of packages")

                    return packages
                }

                override fun getJSMainModuleName(): String = "index"

                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
            }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
       }
  }
}
