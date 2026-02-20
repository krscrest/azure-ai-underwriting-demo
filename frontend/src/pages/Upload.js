import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument, analyseRisk } from "../api";

export default function Upload({ onSubmit }) {
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [fields, setFields] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setExtracting(true);
    try {
      const res = await uploadDocument(f);
      const extracted = {};
      const conf = {};
      for (const [key, val] of Object.entries(res.fields)) {
        extracted[key] = val.value;
        conf[key] = Math.round(val.confidence * 100);
      }
      setFields(extracted);
      setConfidence(conf);
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    try {
      const result = await analyseRisk(fields);
      if (onSubmit) onSubmit(fields);
      navigate("/risk", { state: { risk: result, fields } });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalysing(false);
    }
  };

  const fieldLabels = {
    applicant_name: "Applicant Name",
    date_of_birth: "Date of Birth",
    policy_type: "Policy Type",
    coverage_amount: "Coverage Amount",
    address: "Address",
    prior_claims_count: "Prior Claims Count",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">New Submission — Document Upload</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload Zone / Document Preview */}
        <div>
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400"
              }`}
              onClick={() => document.getElementById("file-input").click()}
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-lg font-medium text-slate-700">
                Drag & drop your document here
              </p>
              <p className="text-sm text-slate-400 mt-1">or click to browse — PDF or image files</p>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  📄
                </div>
                <div>
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 flex items-center justify-center min-h-[300px]">
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-3">📋</div>
                  <p className="text-sm">Document uploaded successfully</p>
                  <p className="text-xs mt-1">Azure AI Document Intelligence processed this file</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Extracted Fields */}
        <div>
          {extracting ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-slate-700">Azure AI is reading your document...</p>
              <p className="text-sm text-slate-400 mt-1">Extracting key fields with Document Intelligence</p>
            </div>
          ) : fields ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Extracted Fields</h2>
              <p className="text-sm text-slate-400 mb-4">
                Powered by Azure AI Document Intelligence
              </p>
              <div className="space-y-4">
                {Object.entries(fieldLabels).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-medium text-slate-600">{label}</label>
                      {confidence && (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          {confidence[key]}% confident
                        </span>
                      )}
                    </div>
                    <input
                      type={key === "prior_claims_count" ? "number" : "text"}
                      value={fields[key] ?? ""}
                      onChange={(e) =>
                        setFields({ ...fields, [key]: key === "prior_claims_count" ? Number(e.target.value) : e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleAnalyse}
                disabled={analysing}
                className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {analysing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Analysing Risk...
                  </span>
                ) : (
                  "Analyse Risk"
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center justify-center min-h-[400px] text-slate-400">
              <div className="text-center">
                <div className="text-5xl mb-3">🤖</div>
                <p>Upload a document to begin AI extraction</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
