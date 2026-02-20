import React from "react";

export default function Navbar({ onLogout }) {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              Azure AI Underwriting
            </span>
          </a>
          <button
            onClick={onLogout}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
