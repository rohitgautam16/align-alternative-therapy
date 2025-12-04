// src/controllers/admin Controllers/adminHeroBannerController.js
const heroBannerService = require('../../services/admin services/heroBannerService');

const getHeroController = async (req, res) => {
  try {
    const hero = await heroBannerService.getHero();
    return res.json({ success: true, data: hero });
  } catch (err) {
    console.error('getHeroController ERROR:', err && err.stack ? err.stack : err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (err && err.message) : undefined
    });
  }
};

const updateHeroController = async (req, res) => {
  try {
    const payload = {
      video_url: req.body.video_url,
      mobile_video_url: req.body.mobile_video_url,
      marquee_text: req.body.marquee_text,
      column_2_text: req.body.column_2_text,
      column_3_text: req.body.column_3_text,
      overlay_opacity: req.body.overlay_opacity
    };

    const updated = await heroBannerService.upsertHero(payload, req.user?.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

module.exports = { getHeroController, updateHeroController };
