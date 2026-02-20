import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function gaugeColor(score) {
  if (score < 40) return "#22c55e";
  if (score < 70) return "#f59e0b";
  return "#ef4444";
}

function badgeClass(rec) {
  if (rec === "Approve") return "bg-green-100 text-green-800 border-green-300";
  if (rec === "Review") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-red-100 text-red-800 border-red-300";
}

export default function RiskScoring() {
  const location = useLocation();
  const navigate = useNavigate();
  const risk = location.state?.risk;
  const fields = location.state?.fields;

  if (!risk) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-500">No risk data available.</p>
        <button
          onClick={() => navigate("/upload")}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Start a new submission
        </button>
      </div>
    );
  }

  const { risk_score, risk_factors, explanation, recommendation } = risk;
  const angle = (risk_score / 100) * 180;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Risk Assessment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-slate-500 mb-4">RISK SCORE</h2>
          <div className="relative w-48 h-24 mb-4">
            <svg viewBox="0 0 200 100" className="w-full">
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke={gaugeColor(risk_score)}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(angle / 180) * 283} 283`}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <span
                className="text-4xl font-bold"
                style={{ color: gaugeColor(risk_score) }}
              >
                {risk_score}
              </span>
            </div>
          </div>
          <div className="flex justify-between w-full text-xs text-slate-400 px-4">
            <span>0 Low</span>
            <span>50 Med</span>
            <span>100 High</span>
          </div>

          {/* Recommendation Badge */}
          <div className="mt-6 w-full text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">AI Recommendation</p>
            <span
              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold border ${badgeClass(recommendation)}`}
            >
              {recommendation === "Approve" && "✅ "}
              {recommendation === "Review" && "⚠️ "}
              {recommendation === "Reject" && "❌ "}
              {recommendation}
            </span>
          </div>
        </div>

        {/* Risk Factors + Explanation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Factors */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Risk Factors</h2>
            <div className="space-y-3">
              {risk_factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                >
                  <span
                    className={`text-lg ${
                      f.impact === "positive" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {f.impact === "positive" ? "↓" : "↑"}
                  </span>
                  <span className="text-sm text-slate-700 flex-1">{f.factor}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      f.impact === "positive"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {f.impact === "positive" ? "Lower risk" : "Higher risk"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Explanation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">🤖</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800">AI Analysis</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">{explanation}</p>
            <p className="text-xs text-slate-400 mt-3">
              Generated by Azure OpenAI (GPT-4)
            </p>
          </div>

          {/* Action */}
          <button
            onClick={() =>
              navigate("/decision/new", {
                state: { risk, fields },
              })
            }
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition text-lg"
          >
            Make Decision →
          </button>
        </div>
      </div>
    </div>
  );
}
