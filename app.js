const video = document.getElementById("video");
const videoContainer = document.getElementById("video-container");
const button1 = document.querySelector(".button1");
const button2 = document.querySelector(".button2");
const button3 = document.querySelector(".button3");
const button4 = document.querySelector(".button4");
const button5 = document.querySelector(".button5");
const button6 = document.querySelector(".button6");

const MODEL_URI = "models";
let mouthOpen = false;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI),
  faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI),
])
  .then(playVideo)
  .catch((err) => {
    console.log(err);
  });

function playVideo() {
  if (!navigator.mediaDevices) {
    console.error("mediaDevices not supported");
    return;
  }
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 360, ideal: 720, max: 1080 },
      },
      audio: false,
    })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log(err);
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);

  canvas.willReadFrequently = true;
  videoContainer.appendChild(canvas);

  const canvasSize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, canvasSize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const DetectionsArray = faceapi.resizeResults(detections, canvasSize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    detectionsDraw(canvas, DetectionsArray);

    if (DetectionsArray.length > 0) {
      const mouth = DetectionsArray[0].landmarks.getMouth();

      const mouthCenter = {
        x: (mouth[0].x + mouth[6].x) / 2,
        y: (mouth[3].y + mouth[10].y) / 2,
      };

      mouthOpen = !(mouth[13].y - mouth[19].y > -15);
      console.log(mouth[13].y - mouth[19].y);
      console.log(mouthOpen);

      moveCursor(mouthCenter.x, mouthCenter.y);
    }
  }, 100);
});

function detectionsDraw(canvas, DetectionsArray) {
  faceapi.draw.drawDetections(canvas, DetectionsArray);
  faceapi.draw.drawFaceLandmarks(canvas, DetectionsArray);
  faceapi.draw.drawFaceExpressions(canvas, DetectionsArray);
}

function moveCursor(x, y) {
  const videoRect = video.getBoundingClientRect();
  const cursor = document.getElementById("cursor");
  if (!cursor) {
    const newCursor = document.createElement("div");
    newCursor.id = "cursor";
    newCursor.style.position = "absolute";
    newCursor.style.width = "30px";
    newCursor.style.height = "30px";
    newCursor.style.backgroundColor = "red";
    newCursor.style.borderRadius = "50%";
    document.body.appendChild(newCursor);
  }

  const scaledX = videoRect.left + (x / video.width) * videoRect.width;
  const scaledY = videoRect.top + (y / video.height) * videoRect.height;
  const cursorElement = document.getElementById("cursor");

  cursorElement.style.left = `${scaledX}px`;
  cursorElement.style.top = `${scaledY}px`;

  const targetElement = document.elementFromPoint(scaledX, scaledY);

  if (targetElement) {
    const mouseMoveEvent = new MouseEvent("mousemove", {
      clientX: scaledX,
      clientY: scaledY,
      bubbles: true,
    });
    targetElement.dispatchEvent(mouseMoveEvent);

    // Add active class if the target element is a button or link
    if (
      targetElement.classList.contains("button1") ||
      targetElement.classList.contains("button2") ||
      targetElement.classList.contains("button3") ||
      targetElement.classList.contains("button4") ||
      targetElement.classList.contains("button5") ||
      targetElement.classList.contains("button6") ||
      targetElement.tagName.toLowerCase() === "a"
    ) {
      targetElement.classList.add("active");
      if (mouthOpen) {
        //put eating actions here
        console.log(targetElement.tagName);
        if (targetElement.tagName == "A") {
          let url = targetElement.getAttribute("href");
          window.location.href = url;
        } else {
          targetElement.classList.add("clicked");
        }
      }
    }

    // Remove active class from buttons or links that are not under the cursor
    [button1, button2, button3, button4, button5, button6].forEach((button) => {
      if (button !== targetElement) {
        button.classList.remove("active");
      }
    });
  }
}
