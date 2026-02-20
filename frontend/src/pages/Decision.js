import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getSubmission, submitDecision, chatWithCopilot } from "../api";

const SUGGESTIONS = [
  "What are the biggest risk factors here?",
  "How does this compare to a typical approved applicant?",
  "What conditions should I attach to this approval?",
];

export default function Decision() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sub, setSub] = useState(location.state?.risk ? { ...location.state.fields, ...location.state.risk, id: "new" } : null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I've reviewed this submission. Ask me anything about this applicant or this policy." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (id && id !== "new" && !location.state) {
      getSubmission(id).then(setSub).catch(console.error);
    }
  }, [id, location.state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const subId = sub?.id || id;

  const handleDecision = async (decision) => {
    setSubmitting(true);
    try {
      const result = await submitDecision(subId, decision, notes);
      navigate("/confirmation", { state: { result: result, decision } });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const sendChat = async (msg) => {
    const userMsg = msg || chatInput;
    if (!userMsg.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await chatWithCopilot(subId, userMsg);
      setMessages((prev) => [...prev, { role: "assistant", text: res.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't process that request." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const score = sub.risk_score;
  const scoreColor = score < 40 ? "text-green-600" : score < 70 ? "text-amber-600" : "text-red-600";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Underwriter Decision</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary + Decision */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Applicant Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="ml-2 font-medium text-slate-800">{sub.applicant_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Policy:</span>
                <span className="ml-2 font-medium text-slate-800">{sub.policy_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Coverage:</span>
                <span className="ml-2 font-medium text-slate-800">{sub.coverage_amount}</span>
              </div>
              <div>
                <span className="text-slate-500">Risk Score:</span>
                <span className={`ml-2 font-bold text-lg ${scoreColor}`}>{score}</span>
              </div>
              <div>
                <span className="text-slate-500">DOB:</span>
                <span className="ml-2 font-medium text-slate-800">{sub.date_of_birth}</span>
              </div>
              <div>
                <span className="text-slate-500">Prior Claims:</span>
                <span className="ml-2 font-medium text-slate-800">{sub.prior_claims_count}</span>
              </div>
            </div>
            {sub.explanation && (
              <p className="mt-4 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                {sub.explanation}
              </p>
            )}
          </div>

          {/* Decision Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Decision</h2>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleDecision("Approved")}
                disabled={submitting}
                className="flex-1 bg-green-50 border-2 border-green-300 text-green-800 py-3 rounded-xl font-semibold hover:bg-green-100 disabled:opacity-50 transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleDecision("Under Review")}
                disabled={submitting}
                className="flex-1 bg-amber-50 border-2 border-amber-300 text-amber-800 py-3 rounded-xl font-semibold hover:bg-amber-100 disabled:opacity-50 transition"
              >
                ⚠️ Request More Info
              </button>
              <button
                onClick={() => handleDecision("Rejected")}
                disabled={submitting}
                className="flex-1 bg-red-50 border-2 border-red-300 text-red-800 py-3 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 transition"
              >
                ❌ Reject
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Underwriter Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add your notes here..."
              />
            </div>
          </div>
        </div>

        {/* Right: AI Copilot Chat */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">AI Copilot</p>
                <p className="text-xs text-slate-400">Powered by Azure OpenAI</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-3 py-2 rounded-xl text-sm text-slate-400">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestion Chips */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendChat(s)}
                    className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask the AI Copilot..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => sendChat()}
                  disabled={chatLoading}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
