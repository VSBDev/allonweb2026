export default {
  id: 'lesson-4',
  type: 'bullets',
  kicker: 'Lesson 4',
  title: 'Storage & Organized Data',
  subtitle: 'Local Databases & File Hierarchies',
  points: [
    '**navigator.storage.getDirectory()**: Accessing the "Origin Private File System" (OPFS) — invisible to the OS, dedicated to your app.',
    '**getDirectoryHandle / getFileHandle**: Traversing and creating your app\'s own "App Data" subdirectories.',
    '**SQL.js (`new SQL.Database`)**: Running relational queries in-browser with a database you can persist to OPFS.',
    '**Persistence Strategy**: Choosing when to use standard JSON (files) vs. relational SQL (playlists / libraries).',
    '**Sandboxing Advantages**: OPFS data persists even if the user clears their downloads folder.'
  ]
};
