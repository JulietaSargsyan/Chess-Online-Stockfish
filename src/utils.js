const audioCache = {};

export function playSound(filename, volume = 1.0) {
  const path = `/sounds/${filename}`;

  if (!audioCache[path]) {
    const audio = new Audio(path);
    audio.volume = volume;
    audioCache[path] = audio;
  }

  const sound = audioCache[path];
  sound.currentTime = 0;
  sound.play().catch((error) => {
    console.warn(`Unable to play sound "${filename}":`, error.message);
  });
}