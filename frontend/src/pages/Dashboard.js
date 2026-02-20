import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../api";

const statCards = [
  { label: "Submissions This Week", key: "submissions_this_week", icon: "📋", color: "blue" },
  { label: "Auto-Approved by AI", key: "auto_approved", icon: "✅", color: "green" },
  { label: "Flagged for Review", key: "flagged_for_review", icon: "⚠️", color: "yellow" },
  { label: "Rejected", key: "rejected", icon: "❌", color: "red" },
];

const colorMap = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

function statusBadge(status) {
  const map = {
    Approved: "bg-green-100 text-green-800",
    "Under Review": "bg-amber-100 text-amber-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-slate-100 text-slate-800";
}

function scoreColor(score) {
  if (score < 40) return "text-green-600";
  if (score < 70) return "text-amber-600";
  return "text-red-600";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <button
          onClick={() => navigate("/upload")}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span className="text-lg">+</span> New Submission
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-xl border p-5 ${colorMap[card.color]}`}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-3xl font-bold">{data.stats[card.key]}</div>
            <div className="text-sm mt-1 opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Applicant Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Policy Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {sub.applicant_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{sub.policy_type}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${scoreColor(sub.risk_score)}`}>
                      {sub.risk_score}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(sub.status)}`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{sub.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/decision/${sub.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
