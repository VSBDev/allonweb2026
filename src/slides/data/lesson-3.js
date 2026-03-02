export default {
  id: 'lesson-3',
  type: 'bullets',
  kicker: 'Lesson 3',
  title: 'Ingestion & Interactivity',
  subtitle: 'The Inflow of Digital Assets',
  points: [
    '**dragover**: The event for indicating a valid drop target (always use **e.preventDefault()** to allow drop).',
    '**drop**: The terminal event where the **e.dataTransfer** object becomes populated with local files.',
    '**e.dataTransfer.files**: Access binary content as a standard File list.',
    '**file.text()**: Asynchronously translating raw bytes into a readable string format.',
    '**JSON.parse(text)**: Turning imported session payloads into structured objects you can inspect and visualize.'
  ]
};
