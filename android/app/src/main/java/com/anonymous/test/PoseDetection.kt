// HandLandmarks.kt

package com.myproject

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.OutputHandler
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.mrousavy.camera.frameprocessors.Frame

class PoseDetection(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        initModel()
    }

    override fun getName(): String {
        return "PoseDetection" // The name used to access the module from JavaScript
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
    }

     @ReactMethod
    fun initModel() {
        // Check if the Pose Detection has already been initialized
        if (PoseDetectionHolder.poselandmarker != null) {
            // Model is already initialized, send a status update to JavaScript
            val alreadyInitializedParams = Arguments.createMap()
            alreadyInitializedParams.putString("status", "Model already initialized")
            sendEvent("onPoseDetectionStatus", alreadyInitializedParams)
            return
        }

        // Define the result listener
        val resultListener = OutputHandler.ResultListener { result: PoseLandmarkerResult, inputImage: MPImage ->
            Log.d("PoseDetectionFrameProcessor", "Detected ${result.landmarks().size} persons")

            // Prepare the data to be sent back to JavaScript
            val landmarksArray = Arguments.createArray()

            for (poseLandmarks in result.landmarks()) {
                val poseMap = Arguments.createArray()
                for ((index, posemark) in poseLandmarks.withIndex()) {
                    val landmarkMap = Arguments.createMap()
                    landmarkMap.putInt("keypoint", index)
                    landmarkMap.putDouble("x", posemark.x().toDouble())
                    landmarkMap.putDouble("y", posemark.y().toDouble())
                    landmarkMap.putDouble("z", posemark.z().toDouble())
                    poseMap.pushMap(landmarkMap)
                }
                landmarksArray.pushArray(poseMap)
            }

            val params = Arguments.createMap()
            params.putArray("landmarks", landmarksArray)
            // Send the landmarks data back to JavaScript
            sendEvent("onPoseLandmarksDetected", params)

        }

            // Initialize the Pose Landmarker
            try {
                val context: Context = reactApplicationContext
                val baseOptions = BaseOptions.builder()
                        .setModelAssetPath("pose_landmarker_lite.task")
                        .build()

                val poseLandmarkerOptions = PoseLandmarker.PoseLandmarkerOptions.builder()
                        .setBaseOptions(baseOptions)
                        .setNumPoses(1)
                        .setRunningMode(RunningMode.LIVE_STREAM)
                        .setResultListener(resultListener)
                        .build()

                PoseDetectionHolder.poselandmarker = PoseLandmarker.createFromOptions(context, poseLandmarkerOptions)

                // Send success event to JS
                val successParams = Arguments.createMap()
                successParams.putString("status", "Model initialized successfully")
                sendEvent("onPoseLandmarksStatus", successParams)

            } catch (e: Exception) {
                Log.e("PoseLandmarksFrameProcessor", "Error initializing PoseLandmarker", e)

                // Send error event to JS
                val errorParams = Arguments.createMap()
                errorParams.putString("error", e.message)
                sendEvent("onPoseLandmarksError", errorParams)
            }

        }

}