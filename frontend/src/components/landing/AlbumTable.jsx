import React, { useState } from "react";
import MemoryImg from "../../assets/images/Memory.png";
import PeakStateImg from "../../assets/images/Peak State.jpg";
import OptimismImg from "../../assets/images/optimism.jpg";
import IntuitionImg from "../../assets/images/Intuition.jpg";

const AlbumTable = () => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const albumData = [
    { Name: "Memory", Genre: "Soulful", Category: "Mind", image: MemoryImg },
    { Name: "Peak State", Genre: "Soulful", Category: "Mind", image: PeakStateImg },
    { Name: "Optimism", Genre: "Soulful", Category: "Mind", image: OptimismImg },
    { Name: "Intuition", Genre: "Soulful", Category: "Mind", image: IntuitionImg },
  ];

  const handleMouseMove = (event) => {
    setCursorPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div
      className="bg-black text-white p-10 min-h-max flex flex-col items-center w-screen"
      onMouseMove={handleMouseMove} // Track mouse movement
    >
      <h1 className="text-4xl font-bold mb-8">PLAYLISTS</h1>
      <div className="relative w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className=" text-white">
              <th className="p-6 border-b border-gray-600 text-center text-lg">Name</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg">Genre</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg">Category</th>
              <th className="p-6 border-b border-gray-600 text-center text-lg"></th>
            </tr>
          </thead>
          <tbody>
            {albumData.map((row, index) => (
              <tr
                key={index}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`transition-colors ${
                  hoveredRow === index ? "bg-red-500" : "bg-black"
                }`}
              >
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Name}</td>
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Genre}</td>
                <td className="p-6 border-b border-gray-600 text-center text-base">{row.Category}</td>
                <td className="p-6 border-b border-gray-600 text-center">
                  <button className="text-sm font-bold text-white border px-4 py-2 rounded-full transition-transform hover:scale-105">
                    VIEW ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Hover Image */}
        {hoveredRow !== null && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              top: cursorPosition.y - 220,
              left: cursorPosition.x - 100, 
            }}
          >
            <img
              src={albumData[hoveredRow].image}
              alt={albumData[hoveredRow].Name}
              className="w-80 h-48 object-fill rounded-md border border-gray-500 shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumTable;
