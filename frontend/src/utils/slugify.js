export default function slugify(str = '') {
  if (!str || typeof str !== 'string') return '';

  let s = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.replace(/\s+/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-+|-+$/g, '');

  if (!s) s = 'post-' + Date.now();

  return s;
}
