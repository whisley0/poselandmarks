// For JS/TS
import { matchFont, PaintStyle, Skia, Text } from "@shopify/react-native-skia";
import React, { useEffect, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleSheet
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

const test_angles = [
  [12, 14, 16], // left elbow
  [11, 13, 15], // right elbow
  [24, 26, 28], // left knee
  [23, 25, 27], // right knee
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

function findAngleAtPointB(A, B, C) {
  console.log(`coordinate of B: ${B.x}, ${B.y}`);
  const angleBA = Math.atan2(A.y - B.y, A.x - B.x);
  const angleBC = Math.atan2(C.y - B.y, C.x - B.x);
  let angle = angleBC - angleBA;

  // Normalize angle to be within -PI to PI
  if (angle > Math.PI) angle -= 2 * Math.PI;
  if (angle < -Math.PI) angle += 2 * Math.PI;

  return angle; // Angle in radians
}

//main application
function PoseCameraDemo(): React.JSX.Element{

  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "bold",
  };
  const font = matchFont(fontStyle);

  const landmarks = useSharedValue({});
  const anglevalues = useSharedValue<number[]>([]); // Initialize with an empty array or an existing one
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  
  // initialize initial position 
  const initialPosition = 'up'
  const [position, setPosition] = useState(initialPosition);
  
  // Initialize count and updateCount using useState
  const initialCount = 0
  const [count, setCount] = useState(initialCount);
  const up_angle = 180
  const down_angle = 90;
  const error = 10; // error margin for angle detection

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Fill);
  paint.setStrokeWidth(2);
  paint.setColor(Skia.Color('red'));

  const linePaint = Skia.Paint();
  linePaint.setStyle(PaintStyle.Fill);
  linePaint.setStrokeWidth(2);
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
        
        console.log("onPoseLandmarksDetected: ", event.landmarks);

        /*
          This is where you can handle converting the data into commands
          for further processing.
        */
        if (event.landmarks.length) {
          const person = event.landmarks[0]
          const angle_list = [];

          for (const [A, B, C] of test_angles) {
            // A, B, C are indices of the landmarks
            const pointA = { x: person[A].x, y: person[A].y };
            const pointB = { x: person[B].x, y: person[B].y };
            const pointC = { x: person[C].x, y: person[C].y };

            const angleRad = findAngleAtPointB(pointA, pointB, pointC);
            const angleDeg = (angleRad * 180) / Math.PI;
            console.log(`Angle at B: ${angleDeg} degrees`);
            angle_list.push(angleDeg);
          }
          console.log('Angles list:', angle_list);
          anglevalues.value = angle_list; // Update the shared value with the angles
          //console.log('Angles shared value variable:', anglevalues.value);

        } 

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
    //console.log('data 3.0:', landmarks.value);   

    /* 
      Paint landmarks on the screen.
      Note: This paints landmarks from the previous frame since
      frame processing is not synchronous.
    */
  
    if (landmarks.value[0]) {
      const hand = landmarks.value[0];
      const keyAngles = anglevalues.value;
      
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

      //console.log(`key Angles: ${keyAngles}`);

      // Draw angles at specified points
      if (font && keyAngles.length !== 0) {
        for (const [A, B, C] of test_angles) {
          const angle = keyAngles.shift()
          if (angle === undefined) {
            console.warn("Angle is undefined for one of the landmarks.");
          } else {
          console.log(`Printed Angles: ${angle} on landmark ${B}`);
          frame.drawText(
            angle.toString(),
            hand[B].x * Number(frameWidth),
            hand[B].y * Number(frameHeight),
            paint,
            font
            ); 
          }
        }
      } else if (font == null) {
          console.warn("Font is not loaded.");
      } else if (keyAngles.length === 0) {
          console.warn("keyAngles is undefined.");
      }
      
      //logic
      //1. if previous state is up
      if (position === 'up') {
        //2. if angle is less than down_angle
        if (anglevalues.value[0] < down_angle + error && anglevalues.value[0] > down_angle - error) {
          //3. change position to down
          setPosition('down');
          //4. increment count
          setCount(count + 1);
        }
      } else if (position === 'down') {
        //5. if angle is greater than up_angle
        if (anglevalues.value[0] > up_angle - error && anglevalues.value[0] < up_angle + error) {
        //6. change position to up
          setPosition('up');
        }
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
      outputOrientation = "device"
    />
  );

}

const styles = StyleSheet.create({})

export default PoseCameraDemo;