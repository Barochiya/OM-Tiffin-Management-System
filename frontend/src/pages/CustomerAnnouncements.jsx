import { House, CreditCard, LogOut, Megaphone, Inbox, MessageCircle, FileText, Download, ChartColumn, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerAnnouncements,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerAnnouncements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadAnnouncements = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }
        const result = await getCustomerAnnouncements();
        setAnnouncements(
          Array.isArray(result?.data) ? result.data : []
        );
        setError("");
      } catch (err) {
        console.error("Customer announcements error:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          logoutCustomer();
          navigate("/customer-login", { replace: true });
          return;
        }
        setError(
          err?.response?.data?.message ||
            "Unable to load announcements."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );
  useEffect(() => {
    loadAnnouncements({ showLoader: true });
  }, [loadAnnouncements]);
  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", { replace: true });
  };
  const formatDateTime = (value) => {
    if (!value) {
      return {
        date: "Date unavailable",
        time: "",
      };
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return {
        date: "Date unavailable",
        time: "",
      };
    }
    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };
  const getStatus = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "read":
        return {
          label: "Read",
          icon: "✓",
          bg: "#ecfdf3",
          color: "#087443",
          border: "#b7ebcd",
        };
      case "delivered":
        return {
          label: "Delivered",
          icon: "✓",
          bg: "#eff6ff",
          color: "#1d4ed8",
          border: "#bfdbfe",
        };
      case "sent":
        return {
          label: "Sent",
          icon: "✓",
          bg: "#fff7ed",
          color: "#c2410c",
          border: "#fed7aa",
        };
      case "failed":
        return {
          label: "Delivery Failed",
          icon: "!",
          bg: "#fef2f2",
          color: "#b91c1c",
          border: "#fecaca",
        };
      default:
        return {
          label: "Pending",
          icon: "•",
          bg: "#f8fafc",
          color: "#475569",
          border: "#e2e8f0",
        };
    }
  };
  const getMessage = (announcement) => {
    if (
      typeof announcement?.message === "string" &&
      announcement.message.trim()
    ) {
      return announcement.message.trim();
    }
    if (
      typeof announcement?.failureReason === "string" &&
      announcement.failureReason.trim()
    ) {
      return announcement.failureReason.trim();
    }
    return "This announcement does not contain a message.";
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "24px 16px 40px",
        boxSizing: "border-box",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1040px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "22px",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  flex: "0 0 48px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  boxShadow:
                    "0 7px 18px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Megaphone size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "25px",
                    lineHeight: 1.2,
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    color: "#0f172a",
                  }}
                >
                  Announcements
                </h1>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#64748b",
                  }}
                >
                  Important updates from OM Tiffin Service
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                loadAnnouncements({ showLoader: true })
              }
              disabled={refreshing}
              style={{
                border: "1px solid #dbe3ef",
                borderRadius: "11px",
                padding: "10px 15px",
                background: "#0f172a",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: refreshing ? "not-allowed" : "pointer",
                opacity: refreshing ? 0.65 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {refreshing ? "Refreshing..." : "↻  Refresh"}
            </button>
          </div>
        </section>
        {/* Content */}
        {loading ? (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "55px 20px",
              textAlign: "center",
              boxShadow:
                "0 8px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                marginBottom: "12px",
              }}
            >
              <Megaphone size={22} />
            </div>
            <div
              style={{
                color: "#475569",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Loading announcements...
            </div>
          </section>
        ) : error ? (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: "20px",
              padding: "30px 20px",
              textAlign: "center",
              boxShadow:
                "0 8px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 12px",
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              !
            </div>
            <h2
              style={{
                margin: "0 0 7px",
                fontSize: "17px",
                color: "#991b1b",
              }}
            >
              Unable to load announcements
            </h2>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              {error}
            </p>
          </section>
        ) : announcements.length === 0 ? (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "58px 20px",
              textAlign: "center",
              boxShadow:
                "0 8px 30px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                margin: "0 auto 14px",
                borderRadius: "18px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "25px",
              }}
            >
              <Inbox size={22} />
            </div>
            <h2
              style={{
                margin: "0 0 7px",
                fontSize: "18px",
                color: "#0f172a",
              }}
            >
              No Announcements
            </h2>
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              You don't have any announcements yet.
            </p>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {announcements.map((announcement, index) => {
              const status = getStatus(announcement.status);
              const dateValue =
                announcement.createdAt ||
                announcement.sentAt ||
                announcement.updatedAt;
              const dateTime = formatDateTime(dateValue);
              return (
                <article
                  key={
                    announcement._id ||
                    announcement.whatsappMessageId ||
                    `${dateValue}-${index}`
                  }
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "20px",
                    boxShadow:
                      "0 6px 24px rgba(15, 23, 42, 0.05)",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* Announcement heading */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          flex: "0 0 38px",
                          borderRadius: "11px",
                          background: "#eff6ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                        }}
                      >
                        <Megaphone size={22} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "17px",
                            lineHeight: 1.4,
                            fontWeight: 700,
                            color: "#111827",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {announcement.title ||
                            "OM Tiffin Service Announcement"}
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "6px",
                            marginTop: "6px",
                            color: "#64748b",
                            fontSize: "12.5px",
                          }}
                        >
                          <span>{dateTime.date}</span>
                          {dateTime.time && (
                            <>
                              <span>•</span>
                              <span>{dateTime.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        flex: "0 0 auto",
                        border: `1px solid ${status.border}`,
                        background: status.bg,
                        color: status.color,
                        borderRadius: "999px",
                        padding: "5px 9px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>{status.icon}</span>
                      {status.label}
                    </span>
                  </div>
                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "#eef2f7",
                      margin: "16px 0",
                    }}
                  />
                  {/* Message */}
                  <div
                    style={{
                      color: "#334155",
                      fontSize: "14px",
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {getMessage(announcement)}
                  </div>
                  {/* Delivery metadata */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "16px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 9px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        color: "#64748b",
                        fontSize: "11.5px",
                        fontWeight: 600,
                      }}
                    >
                      <MessageCircle size={18} /> WhatsApp
                    </span>
                    {announcement.deliveredAt && (
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "11.5px",
                        }}
                      >
                        Delivered{" "}
                        {formatDateTime(
                          announcement.deliveredAt
                        ).date}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {/* Navigation */}
        <section
          style={{
            marginTop: "18px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "12px",
            boxShadow:
              "0 6px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/customer/dashboard")
              }
              style={{
                border: "none",
                borderRadius: "11px",
                padding: "12px 14px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <House size={18} /> Dashboard
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/customer/payments")
              }
              style={{
                border: "1px solid #dbe3ef",
                borderRadius: "11px",
                padding: "12px 14px",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CreditCard size={18} /> Payment History
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "1px solid #fecaca",
                borderRadius: "11px",
                padding: "12px 14px",
                background: "#fffafa",
                color: "#b91c1c",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
export default CustomerAnnouncements;
