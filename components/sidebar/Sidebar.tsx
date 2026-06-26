import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-bg-200 border-r border-bg-300 flex flex-col p-4 animate-fade-in">
      <h2 className="text-lg font-serif font-semibold text-text-100 mb-4">Sidebar</h2>
      <p className="text-sm text-text-300">Placeholder for history and options.</p>
    </aside>
  );
}
