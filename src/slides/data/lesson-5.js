export default {
  id: 'lesson-5',
  type: 'bullets',
  kicker: 'Lesson 5',
  title: 'Media Stream Signal-Flow',
  subtitle: 'Camera, Canvas & Recording Pipelines',
  points: [
    '**getUserMedia**: The core hook for requesting hardware permissions (Video & Audio).',
    '**rawVideo.srcObject = stream**: Passing live video streams directly into a <video> element.',
    '**canvas.captureStream(30)**: Extracting a high-fidelity video stream from your DOM <canvas> surface.',
    '**MediaRecorder**: The engine for turning live streams into binary **Blob** data (video clips).',
    '**ondataavailable**: Gathering "chunks" of media to finalize into a single executable file.',
    '**URL.createObjectURL(blob)**: Generating a persistent local address for your captured photos/videos.'
  ]
};
