import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetHeroQuery,
  useUpdateHeroMutation,
  useGetR2PresignUrlQuery,
} from "../../utils/api";
import {
  ArrowLeft,
  Save,
  Edit3,
  Upload,
  CheckCircle,
  Video,
  Smartphone,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Enhanced placeholder for video preview
const DEFAULT_VIDEO_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzc0MTUxIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTMwLDcwIDE5MCwxMDUgMTMwLDE0MCIgZmlsbD0iIzlDQTNBRiIvPjx0ZXh0IHg9IjE2MCIgeT0iMTY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gVmlkZW88L3RleHQ+Cjwvc3ZnPg==";

export default function AdminHeroBannerEditor() {
  const navigate = useNavigate();

  // Fetch hero banner data
  const {
    data: hero,
    isLoading,
    isError,
    refetch: refetchHero,
  } = useGetHeroQuery();

  // Mutations
  const [updateHero, { isLoading: saving }] = useUpdateHeroMutation();

  // Local form & UI state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [flash, setFlash] = useState({ txt: "", ok: true });

  // Desktop Video Upload State
  const [selectedDesktopVideoFile, setSelectedDesktopVideoFile] =
    useState(null);
  const [desktopVideoKey, setDesktopVideoKey] = useState(null);
  const [desktopVideoUploading, setDesktopVideoUploading] = useState(false);
  const [desktopVideoUploadProgress, setDesktopVideoUploadProgress] =
    useState(0);
  const [desktopVideoPresignParams, setDesktopVideoPresignParams] =
    useState(null);
  const [desktopVideoPreview, setDesktopVideoPreview] = useState(null);

  // Mobile Video Upload State
  const [selectedMobileVideoFile, setSelectedMobileVideoFile] = useState(null);
  const [mobileVideoKey, setMobileVideoKey] = useState(null);
  const [mobileVideoUploading, setMobileVideoUploading] = useState(false);
  const [mobileVideoUploadProgress, setMobileVideoUploadProgress] = useState(0);
  const [mobileVideoPresignParams, setMobileVideoPresignParams] =
    useState(null);
  const [mobileVideoPreview, setMobileVideoPreview] = useState(null);

  // Fetch presigned URLs
  const { data: desktopVideoPresign } = useGetR2PresignUrlQuery(
    desktopVideoPresignParams || {
      filename: "",
      contentType: "",
      folder: "static-pages-media",
    },
    { skip: !desktopVideoPresignParams }
  );

  const { data: mobileVideoPresign } = useGetR2PresignUrlQuery(
    mobileVideoPresignParams || {
      filename: "",
      contentType: "",
      folder: "static-pages-media",
    },
    { skip: !mobileVideoPresignParams }
  );

  // Initialize form with existing data
  useEffect(() => {
    if (hero) {
      setForm({
        video_url: hero.video_url || "",
        mobile_video_url: hero.mobile_video_url || "",
        marquee_text: hero.marquee_text || "",
        column_2_text: hero.column_2_text || "",
        column_3_text: hero.column_3_text || "",
        overlay_opacity: hero.overlay_opacity ?? 0.2,
      });
    }
  }, [hero]);

  // Flash message auto-dismiss
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: "", ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Clean up video preview URLs [web:16]
  useEffect(() => {
    return () => {
      if (desktopVideoPreview) URL.revokeObjectURL(desktopVideoPreview);
      if (mobileVideoPreview) URL.revokeObjectURL(mobileVideoPreview);
    };
  }, [desktopVideoPreview, mobileVideoPreview]);

  // Handle Desktop Video Upload [web:11][web:12]
  const handleDesktopVideoUpload = async () => {
    if (!selectedDesktopVideoFile) return;

    setDesktopVideoUploading(true);
    setDesktopVideoUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });

    try {
      setDesktopVideoPresignParams({
        filename: selectedDesktopVideoFile.name,
        contentType: selectedDesktopVideoFile.type,
        folder: "static-pages-media",
      });
    } catch (err) {
      console.error("Upload error:", err);
      setFlash({
        txt: `Desktop video upload failed: ${err.message}`,
        ok: false,
      });
      setDesktopVideoUploading(false);
      setDesktopVideoUploadProgress(0);
    }
  };

  // Handle Mobile Video Upload
  const handleMobileVideoUpload = async () => {
    if (!selectedMobileVideoFile) return;

    setMobileVideoUploading(true);
    setMobileVideoUploadProgress(5);
    setFlash({ txt: "Getting upload URL...", ok: true });

    try {
      setMobileVideoPresignParams({
        filename: selectedMobileVideoFile.name,
        contentType: selectedMobileVideoFile.type,
        folder: "static-pages-media",
      });
    } catch (err) {
      console.error("Upload error:", err);
      setFlash({
        txt: `Mobile video upload failed: ${err.message}`,
        ok: false,
      });
      setMobileVideoUploading(false);
      setMobileVideoUploadProgress(0);
    }
  };

  // Desktop Video Upload Effect [web:11][web:18]
  useEffect(() => {
    if (
      !desktopVideoPresign ||
      !selectedDesktopVideoFile ||
      !desktopVideoPresignParams
    )
      return;

    const uploadDesktopVideo = async () => {
      try {
        console.log("🚀 Starting desktop video upload:", {
          presignUrl: desktopVideoPresign.url,
          key: desktopVideoPresign.key,
          fileName: selectedDesktopVideoFile.name,
        });

        setFlash({ txt: "Uploading desktop video...", ok: true });
        setDesktopVideoUploadProgress(10);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10;
            setDesktopVideoUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${desktopVideoPresign.key}`;
            console.log("✅ Desktop video upload successful:", publicUrl);

            setDesktopVideoKey(desktopVideoPresign.key);
            setForm((f) => ({ ...f, video_url: publicUrl }));
            setFlash({ txt: "Desktop video uploaded successfully!", ok: true });
            setDesktopVideoUploadProgress(100);

            setSelectedDesktopVideoFile(null);
            setDesktopVideoPresignParams(null);
            const desktopInput = document.getElementById(
              "hero-desktop-video-upload"
            );
            if (desktopInput) desktopInput.value = "";

            setTimeout(() => {
              setDesktopVideoUploading(false);
              setDesktopVideoUploadProgress(0);
            }, 3000);
          } else {
            throw new Error("Upload failed");
          }
        });

        xhr.addEventListener("error", () => {
          throw new Error("Upload failed");
        });

        xhr.open("PUT", desktopVideoPresign.url);
        xhr.setRequestHeader("Content-Type", selectedDesktopVideoFile.type);
        xhr.send(selectedDesktopVideoFile);
      } catch (err) {
        console.error("Desktop video upload error:", err);
        setFlash({
          txt: `Desktop video upload failed: ${err.message}`,
          ok: false,
        });
        setDesktopVideoUploadProgress(0);
        setDesktopVideoUploading(false);
      }
    };

    uploadDesktopVideo();
  }, [desktopVideoPresign, selectedDesktopVideoFile, desktopVideoPresignParams]);

  // Mobile Video Upload Effect
  useEffect(() => {
    if (
      !mobileVideoPresign ||
      !selectedMobileVideoFile ||
      !mobileVideoPresignParams
    )
      return;

    const uploadMobileVideo = async () => {
      try {
        setFlash({ txt: "Uploading mobile video...", ok: true });
        setMobileVideoUploadProgress(10);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 90) + 10;
            setMobileVideoUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const publicUrl = `https://cdn.align-alternativetherapy.com/${mobileVideoPresign.key}`;

            setMobileVideoKey(mobileVideoPresign.key);
            setForm((f) => ({ ...f, mobile_video_url: publicUrl }));
            setFlash({ txt: "Mobile video uploaded successfully!", ok: true });
            setMobileVideoUploadProgress(100);

            setSelectedMobileVideoFile(null);
            setMobileVideoPresignParams(null);
            const mobileInput = document.getElementById(
              "hero-mobile-video-upload"
            );
            if (mobileInput) mobileInput.value = "";

            setTimeout(() => {
              setMobileVideoUploading(false);
              setMobileVideoUploadProgress(0);
            }, 3000);
          } else {
            throw new Error("Upload failed");
          }
        });

        xhr.addEventListener("error", () => {
          throw new Error("Upload failed");
        });

        xhr.open("PUT", mobileVideoPresign.url);
        xhr.setRequestHeader("Content-Type", selectedMobileVideoFile.type);
        xhr.send(selectedMobileVideoFile);
      } catch (err) {
        console.error("Mobile video upload error:", err);
        setFlash({ txt: "Mobile video upload failed.", ok: false });
        setMobileVideoUploadProgress(0);
        setMobileVideoUploading(false);
      }
    };

    uploadMobileVideo();
  }, [mobileVideoPresign, selectedMobileVideoFile, mobileVideoPresignParams]);

  if (isLoading) return <div className="p-6 text-white">Loading…</div>;
  if (isError || !hero)
    return <div className="p-6 text-red-500">Error loading hero banner</div>;
  if (!form) return null;

  const handleSave = async () => {
    try {
      const payload = {
        video_url: form.video_url,
        mobile_video_url: form.mobile_video_url,
        marquee_text: form.marquee_text,
        column_2_text: form.column_2_text,
        column_3_text: form.column_3_text,
        overlay_opacity: form.overlay_opacity,
      };

      await updateHero({ payload }).unwrap();
      setFlash({ txt: "Hero banner updated.", ok: true });
      setEditMode(false);
      await refetchHero();
    } catch (e) {
      console.error("Update error:", e);
      setFlash({ txt: "Failed to update hero banner.", ok: false });
    }
  };

  return (
    <div className="p-6 text-white space-y-8">
      {/* Flash Messages */}
      <AnimatePresence>
        {flash.txt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-2 text-center ${
              flash.ok ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {flash.txt}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? "Cancel" : "Edit"}
          </button>

          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded disabled:opacity-50 hover:bg-blue-500"
            >
              <Save size={16} /> {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Form & Video Previews */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        {/* Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Marquee Text */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Marquee Text</label>
            {editMode ? (
              <input
                value={form.marquee_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marquee_text: e.target.value }))
                }
                className="w-full p-2 bg-gray-700 rounded text-white"
                placeholder="• Welcome to Align Alternative Therapy •"
              />
            ) : (
              <p>{hero.marquee_text || "—"}</p>
            )}
          </div>

          {/* Column 2 Text */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">
              Column 2 Text (Description)
            </label>
            {editMode ? (
              <textarea
                value={form.column_2_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, column_2_text: e.target.value }))
                }
                rows={3}
                className="w-full p-2 bg-gray-700 rounded text-white"
                placeholder="Experience a unique therapy..."
              />
            ) : (
              <p>{hero.column_2_text || "—"}</p>
            )}
          </div>

          {/* Column 3 Text */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">
              Column 3 Text (CTA)
            </label>
            {editMode ? (
              <textarea
                value={form.column_3_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, column_3_text: e.target.value }))
                }
                rows={3}
                className="w-full p-2 bg-gray-700 rounded text-white"
                placeholder="Login to explore personalized sound therapy..."
              />
            ) : (
              <p>{hero.column_3_text || "—"}</p>
            )}
          </div>

          {/* Overlay Opacity */}
          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">
              Overlay Opacity: {form.overlay_opacity}
            </label>
            {editMode ? (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.overlay_opacity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    overlay_opacity: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
            ) : (
              <p>{hero.overlay_opacity ?? 0.2}</p>
            )}
          </div>
        </div>

        {/* Video Upload Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desktop Video */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Video size={20} />
              <h3 className="text-lg font-semibold">Desktop Video</h3>
            </div>

            {/* Video Preview [web:16][web:19] */}
            <div className="w-full aspect-video bg-gray-900 rounded overflow-hidden">
              {desktopVideoPreview || form.video_url ? (
                <video
                  src={desktopVideoPreview || form.video_url}
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={DEFAULT_VIDEO_PLACEHOLDER}
                    alt="No video"
                    className="opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Video URL Input */}
            <div className="overflow-clip">
              <label className="block text-gray-400 mb-1">Video URL</label>
              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.video_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, video_url: e.target.value }))
                    }
                    placeholder="https://cdn.align-alternativetherapy.com/video.mp4"
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />

                  {/* File Upload */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="hero-desktop-video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedDesktopVideoFile(file);
                        if (file) {
                          setDesktopVideoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <label
                      htmlFor="hero-desktop-video-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedDesktopVideoFile
                          ? selectedDesktopVideoFile.name
                          : "Choose Video"}
                      </span>
                    </label>

                    {desktopVideoKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {desktopVideoUploading && (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {desktopVideoUploadProgress === 0
                            ? "Preparing upload..."
                            : desktopVideoUploadProgress === 100
                            ? "Upload Complete!"
                            : "Uploading..."}
                        </span>
                        <span className="text-xs text-gray-400">
                          {desktopVideoUploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            desktopVideoUploadProgress === 100
                              ? "bg-green-600"
                              : "bg-blue-600"
                          }`}
                          style={{
                            width: `${Math.max(
                              desktopVideoUploadProgress,
                              5
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {selectedDesktopVideoFile && !desktopVideoKey && (
                    <button
                      type="button"
                      onClick={handleDesktopVideoUpload}
                      disabled={desktopVideoUploading}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {desktopVideoUploading
                        ? `Uploading... ${desktopVideoUploadProgress}%`
                        : "Upload Desktop Video"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="break-all text-sm">{hero.video_url || "—"}</p>
              )}
            </div>
          </div>

          {/* Mobile Video */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Smartphone size={20} />
              <h3 className="text-lg font-semibold">
                Mobile Video (Optional)
              </h3>
            </div>

            {/* Video Preview */}
            <div className="w-full aspect-video bg-gray-900 rounded overflow-hidden">
              {mobileVideoPreview || form.mobile_video_url ? (
                <video
                  src={mobileVideoPreview || form.mobile_video_url}
                  controls
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={DEFAULT_VIDEO_PLACEHOLDER}
                    alt="No video"
                    className="opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Video URL Input */}
            <div className="overflow-clip">
              <label className="block text-gray-400 mb-1">Video URL</label>
              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.mobile_video_url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        mobile_video_url: e.target.value,
                      }))
                    }
                    placeholder="https://cdn.align-alternativetherapy.com/mobile-video.mp4"
                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                  />

                  {/* File Upload */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="hero-mobile-video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedMobileVideoFile(file);
                        if (file) {
                          setMobileVideoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <label
                      htmlFor="hero-mobile-video-upload"
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                    >
                      <Upload size={14} />
                      <span className="truncate">
                        {selectedMobileVideoFile
                          ? selectedMobileVideoFile.name
                          : "Choose Video"}
                      </span>
                    </label>

                    {mobileVideoKey && (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded text-sm">
                        <CheckCircle size={14} />
                        <span>Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {mobileVideoUploading && (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">
                          {mobileVideoUploadProgress === 0
                            ? "Preparing upload..."
                            : mobileVideoUploadProgress === 100
                            ? "Upload Complete!"
                            : "Uploading..."}
                        </span>
                        <span className="text-xs text-gray-400">
                          {mobileVideoUploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            mobileVideoUploadProgress === 100
                              ? "bg-green-600"
                              : "bg-purple-600"
                          }`}
                          style={{
                            width: `${Math.max(mobileVideoUploadProgress, 5)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {selectedMobileVideoFile && !mobileVideoKey && (
                    <button
                      type="button"
                      onClick={handleMobileVideoUpload}
                      disabled={mobileVideoUploading}
                      className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm transition-colors"
                    >
                      {mobileVideoUploading
                        ? `Uploading... ${mobileVideoUploadProgress}%`
                        : "Upload Mobile Video"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="break-all text-sm">
                  {hero.mobile_video_url || "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
