// src/components/admin-ui/AdminPlaylistCard.jsx
import React from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPlaylistCard({
  playlist,
  assigned = false,
  onView,
  onToggle,
  status: { loading, success, error } = {},
  hideToggleButton = false, // New prop to hide the add/remove button
}) {
  return (
    <div className="bg-gray-800 rounded-lg flex flex-col-reverse md:flex-row h-auto md:h-48 overflow-hidden">
      {/* Left pane (text + buttons) */}
      <div className="flex-1 flex flex-col p-4 justify-between mt-4 md:mt-0 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-lg md:text-xl text-white truncate mb-1">
            {playlist.name || playlist.title}
          </h3>
          <p className="text-sm md:text-md text-gray-400 truncate">
            Playlist Id: {playlist.id}
          </p>
        </div>
        
        <div className="mt-3 md:mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={onView}
            className="text-blue-400 hover:underline flex items-center gap-1 text-sm whitespace-nowrap"
          >
            <Eye size={14} /> Edit
          </button>
          
          {/* Conditionally render the toggle button */}
          {!hideToggleButton && (
            <button
              onClick={onToggle}
              disabled={loading}
              className={`
                px-2 md:px-3 py-1 rounded text-sm whitespace-nowrap flex-shrink-0
                ${assigned ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {loading
                ? (assigned ? 'Removing…' : 'Adding…')
                : success
                  ? <CheckCircle size={16} />
                  : error
                    ? <XCircle size={16} />
                    : (assigned ? 'Remove' : 'Add')
              }
            </button>
          )}
        </div>
      </div>

      {/* Right pane (image) */}
      <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-full">
        <img
          src={playlist.image || playlist.artwork_filename}
          alt={playlist.name || playlist.title}
          className="w-full h-full rounded-t-lg md:rounded-t-none md:rounded-r-lg object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMzc0MTUxIi8+CjxjaXJjbGUgY3g9Ijk2IiBjeT0iOTYiIHI9IjI0IiBmaWxsPSIjNkI3MjgwIi8+CjxwYXRoIGQ9Ik05NiA2NEwxMjggMTI4SDY0TDk2IDY0WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';
          }}
        />
      </div>
    </div>
  );
}
