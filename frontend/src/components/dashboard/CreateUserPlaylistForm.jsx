import { useState } from 'react';
import { useCreateUserPlaylistMutation } from '../../utils/api';

export default function CreatePlaylistForm() {
  const [createPlaylist, { isLoading }] = useCreateUserPlaylistMutation();
  const [title, setTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // we only send { title } — slug will be auto‑generated server‑side
      await createPlaylist({ title }).unwrap();

      setSuccessMsg('✅ Playlist created successfully!');
      setTitle('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      // TODO: surface error to the user
    }
  };

  return (
    <div className="relative p-8">
      {/* Floating success banner */}
      {successMsg && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded shadow z-10"
        >
          {successMsg}
        </div>
      )}

      {/* Form heading */}
      <h2 className="text-2xl font-semibold mb-4">
        Create Your Own Playlist
      </h2>

      {/* Only title field now */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter playlist title"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-secondary text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Creating…' : 'Create Playlist'}
        </button>
      </form>
    </div>
  );
}
