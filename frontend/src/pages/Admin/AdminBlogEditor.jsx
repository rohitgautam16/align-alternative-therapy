import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  useCreateBlogAdminMutation,
  useSaveBlogAdminMutation,
  usePublishBlogAdminMutation,
  useUnpublishBlogAdminMutation,
  useGetBlogAdminQuery,
  useListBlogCategoriesAdminQuery,
  useCreateBlogCategoryAdminMutation,
  useGetR2PresignUrlQuery,
} from '../../utils/api';

import slugify from '../../utils/slugify';
import { Editor } from '@tinymce/tinymce-react';

export default function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  /** Queries */
  const { data: qData, isLoading: qLoading } = useGetBlogAdminQuery(id, {
    skip: isNew,
  });

  const { data: catData } = useListBlogCategoriesAdminQuery();
  const [createCategory] = useCreateBlogCategoryAdminMutation();

  /** Mutations */
  const [createBlog] = useCreateBlogAdminMutation();
  const [saveBlog] = useSaveBlogAdminMutation();
  const [publishBlog] = usePublishBlogAdminMutation();
  const [unpublishBlog] = useUnpublishBlogAdminMutation();

  /** Form */
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [categories, setCategories] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('draft');
  const [content, setContent] = useState('');

  const editorRef = useRef(null);

  /** load existing blog */
  useEffect(() => {
    if (!qData?.data || isNew) return;
    const b = qData.data;

    setTitle(b.title || '');
    setSlug(b.slug || '');
    setExcerpt(b.excerpt || '');
    setCategories(b.categories || []);
    setCoverImage(b.cover_image || '');
    setAuthor(b.author || '');
    setStatus(b.status || 'draft');
    setContent(b.content || '');
  }, [qData, isNew]);

  /** auto-slug */
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  /** CATEGORY SELECT */
  const [catOpen, setCatOpen] = useState(false);
  const catInputRef = useRef(null);

  const allCategories = useMemo(
    () => (catData?.data || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [catData]
  );

  const handleCategoryInput = async (raw) => {
    const name = raw.trim();
    if (!name) return;

    const exists = allCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      if (!categories.find((c) => c.id === exists.id)) {
        setCategories((prev) => [...prev, exists]);
      }
      return;
    }

    const res = await createCategory(name).unwrap();
    const created = res.data;
    setCategories((prev) => [...prev, created]);
  };

  const toggleCategory = (cat) => {
    if (categories.find((c) => c.id === cat.id)) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } else {
      setCategories((prev) => [...prev, cat]);
    }
  };

  /** COVER UPLOAD */
  const [coverPresignParams, setCoverPresignParams] = useState(null);
  const { data: coverPresign } = useGetR2PresignUrlQuery(
    coverPresignParams || { filename: '', contentType: '', folder: '' },
    { skip: !coverPresignParams }
  );

  const handleSelectCover = (file) => {
    setCoverFile(file);
    setCoverPresignParams({
      filename: file.name,
      contentType: file.type,
      folder: 'align-images/blog/covers',
    });
  };

  useEffect(() => {
    if (!coverPresign || !coverFile || !coverPresignParams) return;

    const file = coverFile;
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', coverPresign.url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.onload = () => {
      setCoverImage(`https://cdn.align-alternativetherapy.com/${coverPresign.key}`);
      setCoverPresignParams(null);
      setCoverFile(null);
    };

    xhr.onerror = () => {
      console.error('Cover upload failed');
      setCoverPresignParams(null);
      setCoverFile(null);
    };

    xhr.send(file);
  }, [coverPresign, coverFile, coverPresignParams]);

  /** INLINE UPLOAD */
  const [inlinePresignParams, setInlinePresignParams] = useState(null);
  const inlinePendingRef = useRef(null);

  const { data: inlinePresign } = useGetR2PresignUrlQuery(
    inlinePresignParams || { filename: '', contentType: '', folder: '' },
    { skip: !inlinePresignParams }
  );

  const inlineUploadHandler = useCallback((blobInfo) => {
    return new Promise((resolve, reject) => {
      const file = new File(
        [blobInfo.blob()],
        `inline-${Date.now()}.png`,
        { type: blobInfo.blob().type }
      );

      inlinePendingRef.current = { file, resolve, reject };

      setInlinePresignParams({
        filename: file.name,
        contentType: file.type,
        folder: 'align-images/blog/media',
      });
    });
  }, []);

  useEffect(() => {
    if (!inlinePresign || !inlinePresignParams || !inlinePendingRef.current) return;

    const { file, resolve, reject } = inlinePendingRef.current;
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', inlinePresign.url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.onload = () => {
      const cdnUrl = `https://cdn.align-alternativetherapy.com/${inlinePresign.key}`;
      resolve(cdnUrl);
      inlinePendingRef.current = null;
      setInlinePresignParams(null);
    };

    xhr.onerror = () => {
      reject('Upload failed');
      inlinePendingRef.current = null;
      setInlinePresignParams(null);
    };

    xhr.send(file);
  }, [inlinePresign, inlinePresignParams]);

  /** PAYLOAD */
  const buildPayload = () => ({
    title,
    slug,
    excerpt,
    cover_image: coverImage,
    author,
    content,
    category_ids: categories.map((c) => c.id),
  });

  /** ACTIONS */
  const saveDraft = async () => {
    const payload = buildPayload();
    if (isNew) {
      const res = await createBlog(payload).unwrap();
      navigate(`/admin/blogs/${res.id}`, { replace: true });
    } else {
      await saveBlog({ id, body: payload }).unwrap();
    }
  };

  const publish = async () => {
    const payload = buildPayload();
    let realId = id;

    if (isNew) {
      const res = await createBlog(payload).unwrap();
      realId = res.id;
      navigate(`/admin/blogs/${realId}`, { replace: true });
    } else {
      await saveDraft();
    }

    await publishBlog(realId).unwrap();
    setStatus('published');
  };

  const unpublish = async () => {
    await unpublishBlog(id).unwrap();
    setStatus('draft');
  };

  const filenameToAlt = (name = '') =>
  name
    .replace(/\.[^/.]+$/, '')     
    .replace(/[-_]+/g, ' ')       
    .replace(/\s+/g, ' ')
    .trim();


  const filePickerCallback = (cb, value, meta) => {
    if (meta.filetype !== 'image') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/avif';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        const editor = tinymce.activeEditor;
        const blobCache = editor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];

        const blobInfo = blobCache.create(
          `blobid-${Date.now()}`,
          file,
          base64
        );

        blobCache.add(blobInfo);

        cb(blobInfo.blobUri(), {
          title: file.name,
          alt: filenameToAlt(file.name), // 🔑 auto-alt
        });
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };


  /** EDITOR MEMO */
  const memoEditor = useMemo(() => (
   <Editor
  apiKey="vv2ch895o0fb46u1mplzfqmq6dpp6sx23jeznibc3eacpe8d"
  ref={editorRef}
  value={content}
  onEditorChange={setContent}
  
  init={{
    height: 600,
    menubar: true,

    plugins: 'link lists image media table code fullscreen hr wordcount visualblocks',

    toolbar:
      'undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image media table hr | code fullscreen',

    image_uploadtab: false,
    images_file_types: 'jpg,jpeg,png,webp,avif',

    automatic_uploads: true,
    paste_data_images: true,
    

    images_upload_handler: inlineUploadHandler,
    file_picker_types: 'image',
    file_picker_callback: filePickerCallback, 

    setup: (editor) => {
      editor.on('SetContent', () => {
        const body = editor.getBody();
        if (!body) return;

        body.querySelectorAll('img').forEach(img => {
          if (!img.hasAttribute('alt') || !img.getAttribute('alt')) {
            const src = img.getAttribute('src') || '';
            const filename = src.split('/').pop() || '';
            img.setAttribute('alt', filenameToAlt(filename));
          }

          if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
          }

          if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
          }
        });
      });
    },


    content_style: `
      body { color: black; background: #fff; font-size: 16px; }
      img { max-width: 100%; border-radius: 8px; }
    `,
  }}
/>


  ), [id, inlineUploadHandler, content]);

  if (!isNew && qLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading blog...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isNew ? 'Create New Blog' : 'Edit Blog'}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  status === 'published' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {status === 'published' ? '● Published' : '● Draft'}
                </span>
                {!isNew && (
                  <span className="text-white/50 text-sm">ID: {id}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
              <button
                onClick={() => navigate('/admin/blogs')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 border border-white/10 text-sm sm:text-base"
              >
                <span>←</span> Back
              </button>

              {isNew && (
                <button 
                  onClick={publish} 
                  className="flex-1 sm:flex-none bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-secondary/20 text-sm sm:text-base"
                >
                  Publish Now
                </button>
              )}

              {!isNew && status === 'draft' && (
                <>
                  <button 
                    onClick={saveDraft} 
                    className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 border border-white/10 text-sm sm:text-base"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={publish} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-secondary/20 text-sm sm:text-base"
                  >
                    Publish
                  </button>
                </>
              )}

              {!isNew && status === 'published' && (
                <>
                  <button 
                    onClick={saveDraft} 
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 text-sm sm:text-base"
                  >
                    Update
                  </button>
                  <button 
                    onClick={unpublish} 
                    className="flex-1 sm:flex-none bg-white/10 hover:bg-red-500/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50 text-sm sm:text-base"
                  >
                    Unpublish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT - FIXED HEIGHT CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 h-[520px] lg:h-auto">
          
          {/* LEFT COLUMN - Main Fields */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* TITLE & SLUG CARD */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Blog Title *
                  </label>
                  <input
                    className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none text-sm sm:text-base"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your blog title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    URL Slug
                  </label>
                  <div className="relative">
                    <input
                      className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none font-mono text-xs sm:text-sm"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugTouched(true);
                      }}
                    />
                    {slug && (
                      <div className="mt-2 text-xs text-white/50 flex items-center gap-1 flex-wrap">
                        <span>Preview:</span>
                        <span className="text-secondary break-all">/blog/{slug}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* EXCERPT CARD - FIXED HEIGHT */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Excerpt
              </label>
              <div className="flex-1">
                <textarea
                  className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full h-full text-white placeholder-white/40 transition-all duration-200 outline-none resize-none text-sm sm:text-base"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder="Brief description of your blog post..."
                />
              </div>
              <div className="mt-2 text-xs text-white/50 text-right">
                {excerpt.length} characters
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - Sidebar - FIXED HEIGHT FLEX */}
          <div className="lg:col-span-1 flex flex-col space-y-4 sm:space-y-6 h-full">
            
            {/* AUTHOR CARD */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex-shrink-0">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Author
              </label>
              <input
                className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none text-sm sm:text-base"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
              />
            </div>

            {/* CATEGORIES CARD */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex-shrink-0">
              <label className="block text-sm font-medium text-white/90 mb-3">
                Categories
              </label>

              {/* Selected chips */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="bg-secondary/20 text-secondary px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 border border-secondary/30"
                    >
                      {cat.name}
                      <button
                        className="text-secondary hover:text-white transition-colors"
                        onClick={() => toggleCategory(cat)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  ref={catInputRef}
                  className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none text-sm sm:text-base"
                  placeholder="Search or create..."
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 200)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      await handleCategoryInput(e.target.value);
                      e.target.value = '';
                      setCatOpen(false);
                    }
                  }}
                />
                <div className="absolute right-3 top-2.5 sm:top-3 text-white/40 text-sm">
                  ⏎
                </div>
              </div>

              {catOpen && allCategories.length > 0 && (
                <div className="mt-2 bg-white/10 border border-white/20 rounded-xl max-h-48 overflow-auto">
                  {allCategories.map((cat) => {
                    const isSelected = categories.find((c) => c.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer transition-all duration-150 text-sm sm:text-base ${
                          isSelected
                            ? 'bg-secondary/20 text-secondary font-medium'
                            : 'text-white/80 hover:bg-white/5'
                        } first:rounded-t-xl last:rounded-b-xl`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{cat.name}</span>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

            {/* COVER IMAGE CARD - FLEX GROW TO FILL SPACE */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col">
  <label className="block text-sm font-medium text-white/90 mb-3">
    Cover Image
  </label>

  <div className="flex gap-4 w-full">

    {/* LEFT 50% — Image Preview */}
    <div className="w-1/2">
      {coverImage ? (
        <div className="relative group h-full">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-auto object-cover rounded-xl border border-white/20 shadow-lg"
          />
          <button
            onClick={() => setCoverImage('')}
            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-white/30 border border-dashed border-white/20 rounded-xl">
          No image selected
        </div>
      )}
    </div>

    {/* RIGHT 50% — Upload Area */}
    <div className="w-1/2">
      <label className="block h-full">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleSelectCover(file);
          }}
        />
        <div className="bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 hover:border-secondary/50 rounded-xl p-6 cursor-pointer transition-all duration-200 text-center h-40 flex flex-col justify-center">
          <div className="text-white/60 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <span className="text-white/80 text-sm font-medium block">
            {coverPresignParams ? 'Uploading...' : 'Click to upload or drag'}
          </span>
          <p className="text-white/40 text-xs"></p>
        </div>
      </label>
    </div>

  </div>
</div>


        {/* FULL WIDTH CONTENT EDITOR */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl mt-4 sm:mt-6">
          <label className="block text-sm font-medium text-white/90 mb-3">
            Content Editor
          </label>
          <div className="rounded-xl overflow-hidden border border-white/20">
            {memoEditor}
          </div>
        </div>

      </div>
    </div>
  );
}

