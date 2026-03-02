export default {
  id: 'lesson-6',
  type: 'bullets',
  kicker: 'Lesson 6',
  title: 'Threads & Concurrency',
  subtitle: 'The Battle for the Event Loop',
  points: [
    '**new Worker(blobUrl)**: Spawning a dedicated execution environment outside the main thread.',
    '**postMessage(data)**: The standardized message-passing "bridge" between your UI and your worker.',
    '**self.onmessage = (e) => {}**: Listening for execution commands inside your background thread.',
    '**self.postMessage(result)**: Returning processed results to the UI thread for rendering.',
    '**terminate()**: Vital for "clean kills" of background processing when the user stops a task.',
    '**Performance Isolation**: Protecting the UI (dragging, scrolling) while 100% of a CPU core is busy.'
  ]
};
