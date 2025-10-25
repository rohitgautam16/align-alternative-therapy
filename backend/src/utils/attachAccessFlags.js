function attachAccessFlags(rows, type) {
  if (!Array.isArray(rows)) return [];

  return rows.map((item) => {
    if (type === 'playlist') {
      return {
        ...item,
        paid: item.paid ? 1 : 0, // normalize null→0
      };
    }
    if (type === 'song') {
      return {
        ...item,
        is_free: item.is_free ? 1 : 0,
      };
    }
    return item;
  });
}

module.exports = { attachAccessFlags };
