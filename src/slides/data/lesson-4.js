export default {
  id: 'lesson-4',
  type: 'bullets',
  kicker: 'Lesson 4',
  title: 'Storage & Organized Data',
  subtitle: 'Local Databases & File Hierarchies',
  points: [
    '**navigator.storage.getDirectory()**: Accessing the "Origin Private File System" (OPFS) — invisible to the OS, dedicated to your app.',
    '**getDirectoryHandle / getFileHandle**: Traversing and creating your app\'s own "App Data" subdirectories.',
    '**sqlite3.oo1.JsStorageDb**: A high-level object-oriented SQL interface that runs directly on your OPFS files.',
    '**Persistence Strategy**: Choosing when to use standard JSON (files) vs. relational SQL (playlists / libraries).',
    '**Sandboxing Advantages**: OPFS data persists even if the user clears their downloads folder.'
  ]
};
