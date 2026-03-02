export default {
  id: 'lesson-1',
  type: 'bullets',
  kicker: 'Lesson 1',
  title: 'Audio Signal & Canvas Canvas',
  subtitle: 'The Core of Real-Time Interaction',
  points: [
    '**AudioContext**: The centralized engine for all web audio node routing.',
    '**createOscillator / createGain**: The basic building blocks for generating and controlling sound frequency/volume.',
    '**linearRampToValueAtTime**: Essential for smooth volume transitions, preventing "pops" in your signal.',
    '**requestAnimationFrame**: The standard for 60FPS visual updates, synchronized with the display refresh rate.',
    '**getContext("2d")**: Accessing the low-level rendering surface to draw real-time audio waveforms.'
  ]
};
