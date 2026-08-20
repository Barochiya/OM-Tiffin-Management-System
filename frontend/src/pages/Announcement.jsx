import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../services/customerService";

export default function Announcement() {
  // =========================================
  // STATES
  // =========================================

  const [templateType, setTemplateType] =
    useState("custom");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");

  // Template variables
  const [holidayDate, setHolidayDate] =
    useState("");

  const [holidayReason, setHolidayReason] =
    useState("");

  const [resumeDate, setResumeDate] =
    useState("");

  const [festivalName, setFestivalName] =
    useState("");

  const [delayReason, setDelayReason] =
    useState("");

  const [expectedTime, setExpectedTime] =
    useState("");

  const [breakfast, setBreakfast] =
    useState("");

  const [lunch, setLunch] =
    useState("");

  const [dinner, setDinner] =
    useState("");

  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  // =========================================
  // LOAD CUSTOMERS
  // =========================================

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res =
        await getCustomers(1, 1000);

      setCustomers(res?.data || []);
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FILTER CUSTOMERS BY AUDIENCE
  // =========================================

  const filteredCustomers = useMemo(() => {
    switch (audience) {
      case "active":
        return customers.filter(
          (customer) =>
            customer.status === "Active"
        );

      case "pending":
        return customers.filter(
          (customer) =>
            customer.paymentStatus !==
            "Paid"
        );

      case "lunch":
        return customers.filter(
          (customer) =>
            customer.mealType === "Lunch"
        );

      case "dinner":
        return customers.filter(
          (customer) =>
            customer.mealType === "Dinner"
        );

      case "both":
        return customers.filter(
          (customer) =>
            customer.mealType === "Both"
        );

      case "all":
      default:
        return customers;
    }
  }, [customers, audience]);

  // =========================================
  // CUSTOMERS WITH PHONE NUMBERS
  // =========================================

  const customersWithPhone = useMemo(() => {
    return filteredCustomers.filter(
      (customer) => {
        const phone =
          customer?.phone ||
          customer?.mobile ||
          customer?.whatsappNumber;

        return (
          String(phone || "")
            .replace(/\D/g, "")
            .length >= 10
        );
      }
    );
  }, [filteredCustomers]);

  // =========================================
  // RESET TEMPLATE VARIABLES
  // =========================================

  const resetTemplateVariables = () => {
    setHolidayDate("");
    setHolidayReason("");
    setResumeDate("");
    setFestivalName("");
    setDelayReason("");
    setExpectedTime("");
    setBreakfast("");
    setLunch("");
    setDinner("");
  };

  // =========================================
  // QUICK TEMPLATES
  // =========================================

  const applyTemplate = (type) => {
    resetTemplateVariables();

    setTemplateType(type);

    switch (type) {
      case "holiday":
        setTitle("Holiday Notice");
        break;

      case "festival":
        setTitle("Festival Wishes");
        break;

      case "delay":
        setTitle("Delivery Delay");
        break;

      case "menu":
        setTitle("Today's Menu");
        break;

      case "custom":
      default:
        setTitle("Announcement");
        break;
    }

    setMessage("");
  };

  // =========================================
  // PREVIEW
  // =========================================

  const getPreviewVariables = () => {
    switch (templateType) {
      case "holiday":
        return [
          "Customer",
          holidayDate ||
            "Holiday Date",
          holidayReason ||
            "Reason",
          resumeDate ||
            "Resume Date",
        ];

      case "festival":
        return [
          "Customer",
          festivalName ||
            "Festival Name",
        ];

      case "delay":
        return [
          "Customer",
          delayReason ||
            "Delay Reason",
          expectedTime ||
            "Expected Time",
        ];

      case "menu":
        return [
          "Customer",
          breakfast ||
            "Breakfast",
          lunch ||
            "Lunch",
          dinner ||
            "Dinner",
        ];

      case "custom":
      default:
        return [
          "Customer",
          message ||
            "Announcement",
        ];
    }
  };

  const showPreview = () => {
    const variables =
      getPreviewVariables();

    alert(
      `WhatsApp Template Preview\n\n` +
        `Template: ${templateType}\n\n` +
        variables
          .map(
            (value, index) =>
              `{{${index + 1}}} ${value}`
          )
          .join("\n")
    );
  };

  // =========================================
  // SEND ANNOUNCEMENT
  // =========================================

  const sendAnnouncement = async () => {
    if (
      templateType === "custom" &&
      !message.trim()
    ) {
      alert(
        "Please enter the announcement message."
      );

      return;
    }

    if (
      templateType === "holiday" &&
      (!holidayDate.trim() ||
        !holidayReason.trim() ||
        !resumeDate.trim())
    ) {
      alert(
        "Please enter Holiday Date, Reason and Resume Date."
      );

      return;
    }

    if (
      templateType === "festival" &&
      !festivalName.trim()
    ) {
      alert(
        "Please enter the Festival Name."
      );

      return;
    }

    if (
      templateType === "delay" &&
      (!delayReason.trim() ||
        !expectedTime.trim())
    ) {
      alert(
        "Please enter Delay Reason and Expected Delivery Time."
      );

      return;
    }

    if (
      templateType === "menu" &&
      (!breakfast.trim() ||
        !lunch.trim() ||
        !dinner.trim())
    ) {
      alert(
        "Please enter Breakfast, Lunch and Dinner."
      );

      return;
    }

    if (
      filteredCustomers.length === 0
    ) {
      alert(
        "No customers found for the selected audience."
      );

      return;
    }

    if (
      customersWithPhone.length === 0
    ) {
      alert(
        "No customers with valid phone numbers were found."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Send ${templateType} template to ${customersWithPhone.length} customer(s)?`
      );

    if (!confirmed) return;

    try {
      setSending(true);

      const customerIds =
        customersWithPhone
          .map(
            (customer) =>
              customer._id
          )
          .filter(Boolean);

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/announcements/send`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              templateType,

              title:
                title.trim(),

              message:
                message.trim(),

              audience,

              customerIds,

              holidayDate:
                holidayDate.trim(),

              reason:
                holidayReason.trim(),

              resumeDate:
                resumeDate.trim(),

              festivalName:
                festivalName.trim(),

              delayReason:
                delayReason.trim(),

              expectedTime:
                expectedTime.trim(),

              breakfast:
                breakfast.trim(),

              lunch:
                lunch.trim(),

              dinner:
                dinner.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to send announcement."
        );
      }

      console.log(
        "Announcement API response:",
        data
      );

      const sent =
        data.data?.sent || 0;

      const failed =
        data.data?.failed || 0;

      const total =
        data.data?.totalCustomers ||
        customerIds.length;

      alert(
        `Announcement Sending Completed!\n\n` +
          `Template: ${templateType}\n` +
          `Total Customers: ${total}\n` +
          `WhatsApp Sent: ${sent}\n` +
          `Failed: ${failed}`
      );
    } catch (error) {
      console.error(
        "Announcement error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while sending announcement."
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================
  // TEMPLATE VARIABLE FORM
  // =========================================

  const renderTemplateFields = () => {
    switch (templateType) {
      case "holiday":
        return (
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Holiday Date
              </label>

              <input
                type="text"
                value={holidayDate}
                onChange={(e) =>
                  setHolidayDate(
                    e.target.value
                  )
                }
                placeholder="e.g. 15 August 2026"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Reason
              </label>

              <input
                type="text"
                value={holidayReason}
                onChange={(e) =>
                  setHolidayReason(
                    e.target.value
                  )
                }
                placeholder="e.g. Independence Day"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Resume Date
              </label>

              <input
                type="text"
                value={resumeDate}
                onChange={(e) =>
                  setResumeDate(
                    e.target.value
                  )
                }
                placeholder="e.g. 16 August 2026"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
              />
            </div>
          </div>
        );

      case "festival":
        return (
          <div className="mb-7">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Festival Name
            </label>

            <input
              type="text"
              value={festivalName}
              onChange={(e) =>
                setFestivalName(
                  e.target.value
                )
              }
              placeholder="e.g. Diwali"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        );

      case "delay":
        return (
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Delay Reason
              </label>

              <input
                type="text"
                value={delayReason}
                onChange={(e) =>
                  setDelayReason(
                    e.target.value
                  )
                }
                placeholder="e.g. heavy traffic"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expected Delivery Time
              </label>

              <input
                type="text"
                value={expectedTime}
                onChange={(e) =>
                  setExpectedTime(
                    e.target.value
                  )
                }
                placeholder="e.g. 1:30 PM"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        );

      case "menu":
        return (
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Breakfast
              </label>

              <input
                type="text"
                value={breakfast}
                onChange={(e) =>
                  setBreakfast(
                    e.target.value
                  )
                }
                placeholder="Breakfast"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Lunch
              </label>

              <input
                type="text"
                value={lunch}
                onChange={(e) =>
                  setLunch(
                    e.target.value
                  )
                }
                placeholder="Lunch"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Dinner
              </label>

              <input
                type="text"
                value={dinner}
                onChange={(e) =>
                  setDinner(
                    e.target.value
                  )
                }
                placeholder="Dinner"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        );

      case "custom":
      default:
        return (
          <div className="mb-7">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Announcement Message
            </label>

            <textarea
              rows={7}
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              placeholder="Type your announcement..."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              This message will be sent as
              the approved custom WhatsApp
              template.
            </p>
          </div>
        );
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">

          {/* PAGE HEADER */}

          <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                  📢 Announcement Center
                </h1>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Send approved WhatsApp
                  announcements to your OM
                  Tiffin customers.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-xl">
                  👥
                </span>

                <div>
                  <p className="text-xs text-blue-600">
                    Customers
                  </p>

                  <p className="font-bold text-blue-800">
                    {loading
                      ? "..."
                      : customers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* LEFT */}

            <div className="xl:col-span-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

                {/* TEMPLATE SELECTOR */}

                <div className="mb-7">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    WhatsApp Template
                  </label>

                  <select
                    value={templateType}
                    onChange={(e) =>
                      applyTemplate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="custom">
                      📢 Custom Announcement
                    </option>

                    <option value="holiday">
                      🏖️ Holiday Notice
                    </option>

                    <option value="festival">
                      🎉 Festival Wishes
                    </option>

                    <option value="delay">
                      🚚 Delivery Delay
                    </option>

                    <option value="menu">
                      🍱 Today's Menu
                    </option>
                  </select>
                </div>

                {/* TITLE */}

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    placeholder="Announcement Title"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* TEMPLATE FIELDS */}

                {renderTemplateFields()}

                {/* AUDIENCE */}

                <div className="mb-7">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Send To
                  </label>

                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">
                      👥 All Customers
                    </option>

                    <option value="active">
                      ✅ Active Customers
                    </option>

                    <option value="pending">
                      💰 Pending Payment Customers
                    </option>

                    <option value="lunch">
                      🍽️ Lunch Customers
                    </option>

                    <option value="dinner">
                      🌙 Dinner Customers
                    </option>

                    <option value="both">
                      🍱 Lunch + Dinner Customers
                    </option>
                  </select>
                </div>

                {/* AUDIENCE INFO */}

                <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-medium text-blue-600">
                      Selected Audience
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-800">
                      {filteredCustomers.length}
                    </p>

                    <p className="text-xs text-blue-600">
                      customer(s)
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs font-medium text-green-600">
                      Valid WhatsApp Numbers
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-800">
                      {customersWithPhone.length}
                    </p>

                    <p className="text-xs text-green-600">
                      ready for API sending
                    </p>
                  </div>
                </div>

                {/* QUICK TEMPLATES */}

                <div className="mb-7">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                      📋 Quick Templates
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an approved WhatsApp
                      template.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "holiday"
                        )
                      }
                      className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left font-semibold text-orange-700 transition hover:bg-orange-100"
                    >
                      <div className="mb-2 text-2xl">
                        🏖️
                      </div>

                      <div>
                        Holiday Notice
                      </div>

                      <p className="mt-1 text-xs font-normal text-orange-600">
                        Holiday closure
                        announcement.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "festival"
                        )
                      }
                      className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left font-semibold text-purple-700 transition hover:bg-purple-100"
                    >
                      <div className="mb-2 text-2xl">
                        🎉
                      </div>

                      <div>
                        Festival Wishes
                      </div>

                      <p className="mt-1 text-xs font-normal text-purple-600">
                        Festival greeting.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "delay"
                        )
                      }
                      className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <div className="mb-2 text-2xl">
                        🚚
                      </div>

                      <div>
                        Delivery Delay
                      </div>

                      <p className="mt-1 text-xs font-normal text-red-600">
                        Delivery delay
                        notification.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "menu"
                        )
                      }
                      className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <div className="mb-2 text-2xl">
                        🍱
                      </div>

                      <div>
                        Today's Menu
                      </div>

                      <p className="mt-1 text-xs font-normal text-green-600">
                        Breakfast, lunch
                        and dinner.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          "custom"
                        )
                      }
                      className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <div className="mb-2 text-2xl">
                        📢
                      </div>

                      <div>
                        Custom Announcement
                      </div>

                      <p className="mt-1 text-xs font-normal text-blue-600">
                        Send an approved
                        custom notice.
                      </p>
                    </button>

                  </div>
                </div>

                {/* ACTION BUTTONS */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={
                      sendAnnouncement
                    }
                    disabled={
                      sending ||
                      loading
                    }
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {sending ? (
                      <>⏳ Sending...</>
                    ) : (
                      <>
                        📢 Send Announcement
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      showPreview
                    }
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    👀 Preview
                  </button>

                </div>
              </div>
            </div>

            {/* RIGHT - PREVIEW */}

            <div className="xl:col-span-1">
              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">

                <div className="mb-5">
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      📱
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-800">
                        WhatsApp Preview
                      </h2>

                      <p className="text-xs text-slate-500">
                        Approved template
                        variables
                      </p>
                    </div>

                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">

                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">

                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-green-600">
                      {templateType}
                    </p>

                    <h3 className="mb-3 break-words font-bold text-slate-800">
                      {title ||
                        "Announcement Title"}
                    </h3>

                    <div className="space-y-2 text-sm leading-6 text-slate-600">

                      {getPreviewVariables().map(
                        (
                          value,
                          index
                        ) => (
                          <div
                            key={index}
                            className="rounded-lg bg-slate-50 px-3 py-2"
                          >
                            <span className="font-semibold text-slate-700">
                              {`{{${index + 1}}}`}
                            </span>

                            {" = "}

                            {value}
                          </div>
                        )
                      )}

                    </div>

                  </div>
                </div>

                {/* AUDIENCE SUMMARY */}

                <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">

                      <p className="text-xs font-medium text-blue-600">
                        Selected Audience
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-800">
                        {
                          filteredCustomers.length
                        }{" "}
                        Customer
                        {filteredCustomers.length ===
                        1
                          ? ""
                          : "s"}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {
                          customersWithPhone.length
                        }{" "}
                        valid phone number
                        {customersWithPhone.length ===
                        1
                          ? ""
                          : "s"}
                      </p>

                    </div>

                    <div className="shrink-0 text-3xl">
                      👥
                    </div>

                  </div>
                </div>

                {/* API STATUS */}

                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      ✅
                    </div>

                    <div className="min-w-0">

                      <p className="font-semibold text-green-800">
                        WhatsApp Templates
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        Approved Meta templates
                        are configured for
                        individual customer
                        messaging.
                      </p>

                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}