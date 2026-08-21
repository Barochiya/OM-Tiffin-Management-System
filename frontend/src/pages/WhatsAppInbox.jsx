import { useEffect, useState } from "react";

import {
  getWhatsAppInbox,
  deleteWhatsAppMessage,
  markWhatsAppMessageRead,
  getWhatsAppMedia,
  replyToWhatsAppMessage,
} from "../services/whatsappInboxService";

const WhatsAppMediaPreview = ({ message }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);



  useEffect(() => {
    let objectUrl = null;

    const loadMedia = async () => {
      try {
        setLoading(true);
        setError("");

        const blob =
          await getWhatsAppMedia(message._id);

        objectUrl =
          URL.createObjectURL(blob);

        setUrl(objectUrl);
      } catch (err) {
        console.error(
          "WhatsApp Media Preview Error:",
          err
        );

        setError(
          "Unable to load image."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMedia();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message._id]);

  if (loading) {
    return (
      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
        📸 Loading image...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 font-semibold text-slate-700">
        📸 WhatsApp Image
      </p>

      <div
  onClick={() =>
    setShowFullImage(true)
  }
  className="inline-block cursor-pointer"
>
  <img
    src={url}
    alt={
      message.mediaCaption ||
      "WhatsApp image"
    }
    className="max-h-[500px] w-auto max-w-full rounded-lg border shadow-sm transition hover:opacity-90"
  />
</div>

  {showFullImage && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={() =>
        setShowFullImage(false)
      }
    >
      <button
        type="button"
        onClick={() =>
          setShowFullImage(false)
        }
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-800 shadow-lg hover:bg-slate-200"
        aria-label="Close image"
      >
        ✕
      </button>

      <img
        src={url}
        alt={
          message.mediaCaption ||
          "WhatsApp image"
        }
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      />
    </div>
  )}


      {message.mediaCaption && (
        <p className="mt-3 text-sm text-slate-600">
          {message.mediaCaption}
        </p>
      )}
    </div>
  );
};

export default function WhatsAppInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyText, setReplyText] = useState({});
const [replySending, setReplySending] = useState({});

  const loadMessages = async (showLoader = false) => {
  try {
    if (showLoader) {
      setLoading(true);
    }

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
    if (showLoader) {
      setLoading(false);
    }
  }
};

  const handleDeleteMessage = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this WhatsApp message?"
  );

  if (!confirmed) return;

  try {
    await deleteWhatsAppMessage(id);

    setMessages((prev) =>
      prev.filter((item) => item._id !== id)
    );
  } catch (error) {
    console.error(
      "Delete WhatsApp Message Error:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Failed to delete WhatsApp message."
    );
  }
};

const handleMarkAsRead = async (id) => {
  try {
    await markWhatsAppMessageRead(id);

    setMessages((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              inboxStatus: "read",
            }
          : item
      )
    );
  } catch (error) {
    console.error(
      "Mark WhatsApp Message Read Error:",
      error
    );
  }
};

const handleReply = async (id) => {
  const message = replyText[id]?.trim();

  if (!message) {
    alert("Please enter a message.");
    return;
  }

  try {
    setReplySending((prev) => ({
      ...prev,
      [id]: true,
    }));

    const response =
      await replyToWhatsAppMessage(
        id,
        message
      );

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to send reply."
      );
    }

    setReplyText((prev) => ({
      ...prev,
      [id]: "",
    }));

    await loadMessages();

    alert(
      "WhatsApp reply sent successfully."
    );
  } catch (error) {
    console.error(
      "WhatsApp Reply Error:",
      error
    );

    alert(
      error.response?.data?.message ||
        error.message ||
        "Failed to send WhatsApp reply."
    );
  } finally {
    setReplySending((prev) => ({
      ...prev,
      [id]: false,
    }));
  }
};

  useEffect(() => {
  // First load → show loading
  loadMessages(true);

  // Background refresh → do NOT show loading
  const interval = setInterval(() => {
    loadMessages(false);
  }, 10000);

  return () => {
    clearInterval(interval);
  };
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
            onClick={() => loadMessages(true)}
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
                  <button
                    type="button"
                    onClick={() =>
                        handleDeleteMessage(item._id)
                    }
                    className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-semibold"
                    >
                    🗑️ Delete
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            handleMarkAsRead(item._id)
                        }
                        className="px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-sm font-semibold"
                        >
                        ✓ Read
                        </button>

                        <button
  type="button"
  onClick={() => {
    const text =
      replyText[item._id]?.trim();

    if (!text) {
      alert("Please enter a message.");
      return;
    }

    handleReply(item._id);
  }}
  disabled={replySending[item._id]}
  className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-semibold disabled:opacity-50"
>
  {replySending[item._id]
    ? "Sending..."
    : "💬 Reply"}
</button>

                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
  <input
    type="text"
    value={replyText[item._id] || ""}
    onChange={(event) =>
      setReplyText((prev) => ({
        ...prev,
        [item._id]:
          event.target.value,
      }))
    }
    onKeyDown={(event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        const text =
          replyText[item._id]?.trim();

        if (text) {
          handleReply(item._id);
        }
      }
    }}
    placeholder="Type a reply..."
    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />

  <button
    type="button"
    onClick={() =>
      handleReply(item._id)
    }
    disabled={
      replySending[item._id] ||
      !replyText[item._id]?.trim()
    }
    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {replySending[item._id]
      ? "Sending..."
      : "Send"}
  </button>
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

{item.mediaId &&
  item.type === "image" && (
    <WhatsAppMediaPreview
      message={item}
    />
  )}

{item.mediaId &&
  item.type !== "image" && (
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