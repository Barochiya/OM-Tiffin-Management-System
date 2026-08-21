import { useEffect, useState } from "react";

import {
  getWhatsAppInbox,
} from "../services/whatsappInboxService";

export default function WhatsAppInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getWhatsAppInbox();

      setMessages(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "WhatsApp Inbox Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load WhatsApp inbox."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="p-4 lg:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
              📥 WhatsApp Inbox
            </h1>

            <p className="text-slate-500 mt-1">
              Customer messages and payment screenshots
            </p>
          </div>

          <button
            type="button"
            onClick={loadMessages}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 p-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
            Loading WhatsApp messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <div className="text-5xl mb-4">
              📭
            </div>

            <h2 className="text-xl font-semibold text-slate-700">
              No WhatsApp messages
            </h2>

            <p className="text-slate-500 mt-2">
              Incoming customer messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow border border-slate-200 p-5"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">

                  <div>
                    <h2 className="font-bold text-lg text-slate-800">
                      {item.customer?.customerName ||
                        "Unknown Customer"}
                    </h2>

                    <p className="text-sm text-slate-500">
                      📱 {item.phoneNumber}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {item.type}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.paymentStatus ===
                        "pending_review"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.paymentStatus ===
                      "pending_review"
                        ? "💰 Payment Review"
                        : "Message"}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {item.message && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                )}

                {/* Media */}
                {item.mediaId && (
                  <div className="mt-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                    <div className="font-semibold text-yellow-800">
                      📎 Media received
                    </div>

                    <div className="text-sm text-yellow-700 mt-1">
                      Type: {item.type}
                    </div>

                    {item.mediaFilename && (
                      <div className="text-sm text-yellow-700">
                        File: {item.mediaFilename}
                      </div>
                    )}

                    {item.mediaCaption && (
                      <div className="text-sm text-slate-700 mt-2">
                        {item.mediaCaption}
                      </div>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="mt-4 text-xs text-slate-400">
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleString("en-IN")
                    : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}