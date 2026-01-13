import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useCreateBlogAdminMutation,
  useSaveBlogAdminMutation,
  usePublishBlogAdminMutation,
  useUnpublishBlogAdminMutation,
  useGetBlogAdminQuery,
  useGetR2PresignUrlQuery,
} from '../../utils/api';
import slugify from '../../utils/slugify';
import { Editor } from '@tinymce/tinymce-react';

export default function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  /** RTK Queries */
  const { data: qData, isLoading: qLoading } = useGetBlogAdminQuery(id, {
    skip: isNew,
  });

  const [createBlog] = useCreateBlogAdminMutation();
  const [saveBlog] = useSaveBlogAdminMutation();
  const [publishBlog] = usePublishBlogAdminMutation();
  const [unpublishBlog] = useUnpublishBlogAdminMutation();

  /** Form State */
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('draft');
  const [content, setContent] = useState('');

  /** Inline editor ref */
  const editorRef = useRef(null);

  /** Load on edit */
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

  /** Auto slug until touched */
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  /** Categories handling */
  const addCategory = () => {
    const c = catInput.trim().toLowerCase();
    if (c && !categories.includes(c)) {
      setCategories([...categories, c]);
    }
    setCatInput('');
  };

  const removeCategory = (c) => {
    setCategories(categories.filter(x => x !== c));
  };

  /** --- COVER IMAGE UPLOAD (R2 PRESIGN) --- */
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

  /** Upload after presign ready */
  useEffect(() => {
    if (!coverPresign || !coverFile || !coverPresignParams) return;

    const file = coverFile;
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', coverPresign.url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.onload = () => {
      const cdnUrl = `https://cdn.align-alternativetherapy.com/${coverPresign.key}`;
      setCoverImage(cdnUrl);
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

  /** --- INLINE IMAGE UPLOAD (TINY → R2 PRESIGNED) --- */
  const [inlinePresignParams, setInlinePresignParams] = useState(null);
  const inlinePendingRef = useRef(null);

  const { data: inlinePresign } = useGetR2PresignUrlQuery(
    inlinePresignParams || { filename: '', contentType: '', folder: '' },
    { skip: !inlinePresignParams }
  );

  const inlineUploadHandler = useCallback(async (blobInfo, success, failure) => {
    const file = new File(
      [blobInfo.blob()],
      `inline-${Date.now()}.png`,
      { type: blobInfo.blob().type }
    );

    inlinePendingRef.current = { file, success, failure };

    setInlinePresignParams({
      filename: file.name,
      contentType: file.type,
      folder: 'align-images/blog/media',
    });
  }, []);

  useEffect(() => {
    if (!inlinePresign || !inlinePresignParams || !inlinePendingRef.current) return;

    const { file, success, failure } = inlinePendingRef.current;
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', inlinePresign.url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.onload = () => {
      const cdnUrl = `https://cdn.align-alternativetherapy.com/${inlinePresign.key}`;
      success(cdnUrl);
      inlinePendingRef.current = null;
      setInlinePresignParams(null);
    };

    xhr.onerror = () => {
      failure('Upload failed');
      inlinePendingRef.current = null;
      setInlinePresignParams(null);
    };

    xhr.send(file);
  }, [inlinePresign, inlinePresignParams]);

  /** --- SAVE DRAFT / PUBLISH / UNPUBLISH --- */
  const saveDraft = async () => {
    const payload = {
      title,
      slug,
      excerpt,
      categories,
      cover_image: coverImage,
      author,
      content,
    };

    if (isNew) {
      const res = await createBlog(payload).unwrap();
      navigate(`/dashboard/admin/blogs/${res.id}`, { replace: true });
    } else {
      await saveBlog({ id, body: payload }).unwrap();
    }
  };

  const publish = async () => {
    await saveDraft();
    const blogId = isNew ? qData?.data?.id : id;
    await publishBlog(blogId || id).unwrap();
    setStatus('published');
  };

  const unpublish = async () => {
    await unpublishBlog(id).unwrap();
    setStatus('draft');
  };

  if (!isNew && qLoading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  return (
    <div className="p-6 space-y-6 text-white">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isNew ? 'New Blog Post' : 'Edit Blog Post'}
        </h1>

        <div className="flex gap-2">
          {status === 'draft' && (
            <button onClick={publish} className="bg-secondary text-black px-4 py-2 rounded-full">
              Publish
            </button>
          )}
          {status === 'published' && (
            <button onClick={unpublish} className="bg-white/10 text-white px-4 py-2 rounded-full">
              Unpublish
            </button>
          )}
          <button onClick={saveDraft} className="bg-white/10 text-white px-4 py-2 rounded-full">
            Save Draft
          </button>
        </div>
      </div>

      {/* TITLE */}
      <div>
        <label className="text-sm text-white/70">Title</label>
        <input
          className="bg-white/5 px-3 py-2 rounded w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title…"
        />
      </div>

      {/* SLUG */}
      <div>
        <label className="text-sm text-white/70">Slug</label>
        <input
          className="bg-white/5 px-3 py-2 rounded w-full"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
      </div>

      {/* EXCERPT */}
      <div>
        <label className="text-sm text-white/70">Excerpt</label>
        <textarea
          className="bg-white/5 px-3 py-2 rounded w-full"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
        />
      </div>

      {/* CATEGORIES */}
      <div>
        <label className="text-sm text-white/70">Categories</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map(c => (
            <span key={c} className="bg-white/10 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {c}
              <button onClick={() => removeCategory(c)} className="text-red-400">×</button>
            </span>
          ))}
        </div>
        <input
          className="bg-white/5 px-3 py-2 rounded w-full"
          value={catInput}
          onChange={(e) => setCatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          placeholder="Type and press Enter"
        />
      </div>

      {/* AUTHOR */}
      <div>
        <label className="text-sm text-white/70">Author</label>
        <input
          className="bg-white/5 px-3 py-2 rounded w-full"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author name"
        />
      </div>

      {/* COVER */}
      <div>
        <label className="text-sm text-white/70">Cover Image</label>
        {coverImage && <img src={coverImage} alt="" className="max-w-xl rounded mb-2" />}
        <input
          type="file"
          onChange={(e) => handleSelectCover(e.target.files[0])}
          className="text-white"
        />
      </div>

      {/* TINYMCE EDITOR */}
      <Editor
        apiKey='vv2ch895o0fb46u1mplzfqmq6dpp6sx23jeznibc3eacpe8d'
        ref={editorRef}
        value={content}
        onEditorChange={setContent}
        init={{
          height: 600,
          menubar: true,
          plugins: 'link lists image media table code fullscreen hr wordcount visualblocks',
          toolbar:
            'undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image media table hr | code fullscreen',
          images_upload_handler: inlineUploadHandler,
          content_style: `
            body { color: black; background: #fff; font-size: 16px; }
            img { max-width: 100%; border-radius: 8px; }
          `,
        }}
      />
    </div>
  );
}
