export default {
  id: 'lesson-2',
  type: 'bullets',
  kicker: 'Lesson 2',
  title: 'Local File Persistence',
  subtitle: 'The Death of the "Save File" Sandbox',
  points: [
    '**showSaveFilePicker**: Native OS dialog to obtain a "FileSystemFileHandle" for the local disk.',
    '**handle.createWritable**: Creating a stream capable of writing binary or text data directly to the user\'s file.',
    '**writable.write(blob)**: Sending bytes into the system stream buffer.',
    '**writable.close()**: Vital step to "commit" your changes and release the OS file lock.',
    '**showOpenFilePicker**: Re-importing local data without a server-side "upload" process.'
  ]
};
