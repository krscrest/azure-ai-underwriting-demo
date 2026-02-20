import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function decisionColor(d) {
  if (d === "Approved") return "text-green-700 bg-green-50 border-green-200";
  if (d === "Under Review") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function decisionIcon(d) {
  if (d === "Approved") return "✅";
  if (d === "Under Review") return "⚠️";
  return "❌";
}

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const decision = location.state?.decision;

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-500">No decision data available.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const sub = result.submission;
  const premium = result.premium;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
          <span className="text-3xl">{decisionIcon(decision)}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Decision Submitted</h1>
        <p className="text-slate-500 mt-1">
          Status:{" "}
          <span className={`font-semibold inline-flex px-3 py-0.5 rounded-full border text-sm ${decisionColor(decision)}`}>
            {decision}
          </span>
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Submission Summary</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div>
            <span className="text-slate-500">Applicant:</span>
            <span className="ml-2 font-medium text-slate-800">{sub.applicant_name}</span>
          </div>
          <div>
            <span className="text-slate-500">Policy Type:</span>
            <span className="ml-2 font-medium text-slate-800">{sub.policy_type}</span>
          </div>
          <div>
            <span className="text-slate-500">Coverage:</span>
            <span className="ml-2 font-medium text-slate-800">{sub.coverage_amount}</span>
          </div>
          <div>
            <span className="text-slate-500">Risk Score:</span>
            <span
              className={`ml-2 font-bold ${
                sub.risk_score < 40 ? "text-green-600" : sub.risk_score < 70 ? "text-amber-600" : "text-red-600"
              }`}
            >
              {sub.risk_score}/100
            </span>
          </div>
          <div>
            <span className="text-slate-500">Decision:</span>
            <span className="ml-2 font-semibold text-slate-800">{decision}</span>
          </div>
          <div>
            <span className="text-slate-500">Date:</span>
            <span className="ml-2 font-medium text-slate-800">{sub.date}</span>
          </div>
        </div>
        {sub.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">Underwriter Notes:</span>
            <p className="text-sm text-slate-700 mt-1">{sub.notes}</p>
          </div>
        )}
      </div>

      {/* Premium Quote (if Approved) */}
      {decision === "Approved" && premium && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">📊 Quote Generated</h2>
          <p className="text-sm text-green-700 mb-3">
            Based on the risk assessment, a premium quote has been generated for this policy.
          </p>
          <div className="text-3xl font-bold text-green-700">
            ${premium.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-sm font-normal text-green-600 ml-2">/ year</span>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/")}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
