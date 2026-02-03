import React, { useState, useMemo, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import slugify from '../../utils/slugify';
import {
  useListBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
} from '../../utils/api';

export default function BlogCategorySelect({ value = [], onChange }) {
  const { data, isLoading } = useListBlogCategoriesQuery();
  const [createCategory] = useCreateBlogCategoryMutation();

  const categories = useMemo(() => {
    const list = data?.data || [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return categories;
    const q = query.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const selectedIds = value.map(v => v.id);

  const addCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // check existing
    const existing = categories.find(c => c.slug === slugify(trimmed));
    let cat = existing;

    if (!cat) {
      const res = await createCategory({ name: trimmed }).unwrap();
      cat = res.data;
    }

    // add if not already selected
    if (!selectedIds.includes(cat.id)) {
      onChange([...value, cat]);
    }

    setQuery('');
  };

  const removeCategory = (id) => {
    onChange(value.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* chips */}
      <div className="flex flex-wrap gap-2">
        {value.map(cat => (
          <span
            key={cat.id}
            className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-sm"
          >
            {cat.name}
            <button
              onClick={() => removeCategory(cat.id)}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* combobox */}
      <Combobox
        multiple
        value={value}
        onChange={onChange}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full bg-white/5 px-3 py-2 rounded text-sm"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            placeholder="Search or create category…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query) {
                e.preventDefault();
                addCategory(query);
              }
            }}
          />

          <Transition
            as={Fragment}
            enter="transition duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {(query || filtered.length > 0) && (
              <Combobox.Options className="absolute mt-1 w-full bg-black border border-white/10 rounded shadow-lg z-50 max-h-60 overflow-y-auto text-sm">
                {filtered.map((cat) => (
                  <Combobox.Option
                    key={cat.id}
                    value={cat}
                    className="px-3 py-2 cursor-pointer hover:bg-white/10"
                  >
                    {cat.name}
                  </Combobox.Option>
                ))}

                {/* inline create */}
                {query && (
                  <div
                    onClick={() => addCategory(query)}
                    className="px-3 py-2 cursor-pointer hover:bg-white/10 text-secondary"
                  >
                    + Create "{query}"
                  </div>
                )}
              </Combobox.Options>
            )}
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
