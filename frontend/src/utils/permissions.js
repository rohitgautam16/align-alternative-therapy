/**
 * Determine if user can access a given playlist or song
 */
export function canAccessContent(userTier, playlist, song) {
  const perms = userTier?.permissions || {};

  // 🎵 SONG LOGIC
  if (song) {
    // Free song overrides playlist lock
    if (song.is_free === 1) return true;

    // Free playlist unlocks all songs
    if (playlist?.paid === 0) return true;

    // User has permission to access paid playlists
    if (perms.can_access_paid_playlists) return true;

    // Otherwise locked
    return false;
  }

  // 🎧 PLAYLIST LOGIC
  if (playlist) {
    // Free playlist unlocks
    if (playlist.paid === 0) return true;

    // User has permission to access paid playlists
    if (perms.can_access_paid_playlists) return true;

    // Otherwise locked
    return false;
  }

  return false;
}

/**
 * Determine if user can access CTA (personalized request)
 */
export function canAccessCTA(userTier) {
  if (!userTier) return false;
  // block if tier.id === 1, allow if 2 or 3
  return userTier.id > 1;
}
