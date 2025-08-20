# this is an app to test the functionality of the google mediapipe plugin on a mobile device

This is the step to follow in order to make it work on your machine:

1. Download Node.js and install yarn. Make sure to update your PATH environment variable so that when you enter yarn --version in CMD the version number will appear.
2. Choose a Development IDE, in my case I used Visual Studio Code
3. Open the IDE and from the "Start" screen select, clone git Repository, and copy and paste the repo https://github.com/whisley0/poselandmarks.git in the top message box
   After it is cloned, you will see the folder structure appeared at the left explorer panel in the IDE.
4. Delete nodes_module folder, yarn.lock, package.lock if there is in the explorer panel    
5. Open Terminal in VS code, make sure you are at the root of the project directory and key in "yarn install," stay chilled and all related package will be installed.
6. After the dependencies are installed, key in "npx expo install --check" to make sure all dependencies version are up to date, if there is any suggestion of installing, just install it.
7. Depending on the testing platform, you may need to connect your phone to your computer, in this tutorial, I am using android phone.
8. Go to android folder in terminal, key in ./gradlew clean to clean slate the android build
9. ## Attention
    There is a known bug in the vision-camera and skia that would stop the android phone from displaying the camera vision on screen. In order to patch it, we need to go to node_modules folder, at line 89 of node_modules/react-native-vision-camera/src/useSkiaFrameProcessor.ts, replacing the content inside the try into the followings(excluding try {}):

   try {
    // 2. properly rotate canvas so Frame is rendered up-right.
    const orientation = relativeTo(frame.orientation, previewOrientation)
    switch (orientation) {
      case 'portrait':
        // do nothing
        canvas.translate( 0,frame.height / 2)
        break
      case 'landscape-left':
        // rotate two flips on (0,0) origin and move X + Y into view again
        canvas.translate(frame.height, frame.width)
        canvas.rotate(270, 0, 0)
        canvas.scale(1, -1)
        break
      case 'portrait-upside-down':
        // rotate three flips on (0,0) origin and move Y into view again
        canvas.translate(frame.width, frame.height * 1.5)
        canvas.rotate(180, 0, 0)
        break
      case 'landscape-right':
        // rotate one flip on (0,0) origin and move X into view again
        canvas.translate(frame.height, 0)
        canvas.rotate(90, 0, 0)
        break
      default:
        throw new Error(`Invalid frame.orientation: ${frame.orientation}!`)
    }

    // 3. call actual processing code
    func()
  } finally {
    // 4. restore matrix again to original base
    canvas.restore()
  }
}

10. When everything is ready, at the root of the project, enter "npx expo run:android" to boot up the programe on your android phone.
    

