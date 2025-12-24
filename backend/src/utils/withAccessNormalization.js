const { attachAccessFlags } = require('./attachAccessFlags');

/**
 * Wraps an entire service object so every function that returns
 * playlists or songs automatically adds normalized access flags.
 */
function withAccessNormalization(service) {
  const wrapped = {};

  for (const [key, fn] of Object.entries(service)) {
    if (typeof fn !== 'function') continue;

    wrapped[key] = async (...args) => {
      const result = await fn(...args);

      if (Array.isArray(result)) {
        // If result is an array of playlists or songs
        if (key.toLowerCase().includes('playlist')) {
          return attachAccessFlags(result, 'playlist');
        }
        if (key.toLowerCase().includes('song')) {
          return attachAccessFlags(result, 'song');
        }
      }

      // If function returns an object (e.g., { playlists, songs })
      if (typeof result === 'object' && result !== null) {
        const out = { ...result };
        if (Array.isArray(out.playlists))
          out.playlists = attachAccessFlags(out.playlists, 'playlist');
        if (Array.isArray(out.songs))
          out.songs = attachAccessFlags(out.songs, 'song');
        return out;
      }

      return result;
    };
  }

  return wrapped;
}

module.exports = { withAccessNormalization };
