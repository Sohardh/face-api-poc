import * as faceapi from 'face-api.js';

// Load models and weights
export async function loadModels() {
  const MODEL_URL = `${process.env.PUBLIC_URL}/models/`;

  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceLandmarkTinyModel(MODEL_URL);
  await faceapi.loadFaceRecognitionModel(MODEL_URL);
}

export async function getFullFaceDescription(blob, inputSize = 512) {
  // tiny_face_detector options
  let scoreThreshold = 0.5;
  const OPTION = new faceapi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });
  const useTinyModel = true;

  // fetch image to api
  let img = await faceapi.fetchImage(blob);

  // detect all faces and generate full description from image
  // including landmark and descriptor of each face
  return faceapi.detectAllFaces(img, OPTION).
      withFaceLandmarks(useTinyModel).
      withFaceDescriptors();
}

const maxDescriptorDistance = 0.5;

export async function createMatcher(faceProfile) {
  // Create labeled descriptors of member from profile
  if (!faceProfile) {
    return;
  }

  let labeledDescriptors =[
      new faceapi.LabeledFaceDescriptors(
          'sample',
          faceProfile.descriptors.map(
              (descriptor) => new Float32Array(descriptor),
          ),
      )];

  // Create face matcher (maximum descriptor distance is 0.5)
  return new faceapi.FaceMatcher(
      labeledDescriptors,
      maxDescriptorDistance,
  );
}
