// src/utils/slugify.js
module.exports = function slugify(str = '') {
  if (!str || typeof str !== 'string') return '';

  // normalize accents: "café" -> "cafe"
  let s = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // lowercase
  s = s.toLowerCase();

  // remove emoji + symbols (leave letters, numbers, spaces, hyphens)
  s = s.replace(/[^a-z0-9\s-]/g, '');

  // collapse whitespace -> hyphens
  s = s.replace(/\s+/g, '-');

  // collapse multiple hyphens
  s = s.replace(/-+/g, '-');

  // trim hyphens at ends
  s = s.replace(/^-+|-+$/g, '');

  // fallback to timestamp if empty slug (edge-case)
  if (!s) s = 'post-' + Date.now();

  return s;
}
