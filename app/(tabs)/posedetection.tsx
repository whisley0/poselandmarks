// For JS/TS
import { PaintStyle, Skia } from "@shopify/react-native-skia";
import React, { useEffect } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform, StyleSheet, Text
} from 'react-native';
import {
  Camera,
  Frame,
  useCameraDevice,
  useCameraPermission,
  useSkiaFrameProcessor,
  VisionCameraProxy
} from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-worklets-core';

//initialize key variables
const lines = [
  [0, 1],
  [0, 4],
  [1, 2],
  [2, 3],
  [3, 7],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [19, 17],
  [17, 15],
  [12, 14],
  [14, 16],
  [16, 18],
  [18, 20],
  [20, 16],
  [22, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  [32, 30],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [31, 27]
];

const { PoseDetection } = NativeModules;

const poseLandmarksEmitter = new NativeEventEmitter(PoseDetection);

const poseLandMarkPlugin = VisionCameraProxy.initFrameProcessorPlugin(
  "poseDetection",
   {},
  );

// Create a worklet function 'handLandmarks' that will call the plugin function
export function poseLandmarks(frame: Frame) {
  'worklet'

  if (poseLandMarkPlugin == null) {
    console.log('no plugin found!');
    throw new Error("Failed to load Frame Processor Plugin!");

  }
   return poseLandMarkPlugin.call(frame)
}

//main application
function PoseCameraDemo(): React.JSX.Element{

  const landmarks = useSharedValue({});
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Fill);
  paint.setStrokeWidth(2);
  paint.setColor(Skia.Color('red'));

  const linePaint = Skia.Paint();
  linePaint.setStyle(PaintStyle.Fill);
  linePaint.setStrokeWidth(4);
  linePaint.setColor(Skia.Color('lime'));

  useEffect(() => {
    // Set up the event listener to listen for hand landmarks detection results
    const subscription = poseLandmarksEmitter.addListener(
      'onPoseLandmarksDetected',
      event => {
        'worklet';
        // Update the landmarks shared value to paint them on the screen
        if (event.landmarks.length) {
          landmarks.value = event.landmarks;
        } else {
          landmarks.value = {};
        }
        /*
          The event contains values for landmarks and hand.
          These values are defined in the HandLandmarkerResultProcessor class
          found in the HandLandmarks.swift file.
        */
        console.log("onPoseLandmarksDetected: ", event);

        /*
          This is where you can handle converting the data into commands
          for further processing.
        */

        console.log('data II:', landmarks.value);

      },
    );
    // Clean up the event listener when the component is unmounted
    return () => {
      //landmarks.value 
      subscription.remove();
      console.log('removed');
    };
  }, []);

  useEffect(() => {
    // Request camera permission on component mount
    requestPermission().catch(error => console.log(error));
  }, [requestPermission]);

  const frameProcessor = useSkiaFrameProcessor(frame => {
    'worklet';
    frame.render();

    //landmarks.value = {1, 2}; 

    // Process the frame using the 'handLandmarks' function
    poseLandmarks(frame);

    // Print a simple message
    //console.log('MyComponent rendered!');
    console.log('data 3.0:', landmarks.value);   

    /* 
      Paint landmarks on the screen.
      Note: This paints landmarks from the previous frame since
      frame processing is not synchronous.
    */
  
    if (landmarks.value[0]) {
      const hand = landmarks.value[0];
      
      const frameWidth = frame.width;
      const frameHeight = frame.height;

      // Draw lines connecting landmarks
      for (const [from, to] of lines) {
        frame.drawLine(
          hand[from].x * Number(frameWidth),
          hand[from].y * Number(frameHeight),
          hand[to].x * Number(frameWidth),
          hand[to].y * Number(frameHeight),
          linePaint,
        );
      }

      // Draw circles on landmarks
      for (const mark of hand) {
        frame.drawCircle(
          mark.x * Number(frameWidth),
          mark.y * Number(frameHeight),
          6,
          paint,
        );
      }
    }

  }, []);

  if (!hasPermission) {
    // Display message if camera permission is not granted
    return <Text>No permission</Text>;
  }

  if (device == null) {
    // Display message if no camera device is available
    return <Text>No device</Text>;
  }

  const pixelFormat = Platform.OS === 'ios' ? 'rgb' : 'yuv';

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      pixelFormat={pixelFormat}
    />
  );

}



export default PoseCameraDemo;