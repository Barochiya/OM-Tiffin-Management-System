import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


export default function Announcement() {

  const [title, setTitle] = useState("");

  const [message, setMessage] = useState("");

  const [audience, setAudience] = useState("all");

  return (

    <div className="flex">

      <Sidebar />

      <div className="flex-1 ml-64 min-h-screen bg-slate-100">

        <Navbar />

        <div className="p-8">

          <div className="max-w-5xl mx-auto">

            <div className="bg-white rounded-3xl shadow-xl p-8">

              <h1 className="text-3xl font-bold text-slate-800">

                📢 Announcement Center

              </h1>

              <p className="text-gray-500 mt-2">

                Send announcements to your customers.

              </p>

              <div className="mt-8">

                <label className="font-semibold">

                  Announcement Title

                </label>

                <input

                  type="text"

                  value={title}

                  onChange={(e) => setTitle(e.target.value)}

                  className="w-full mt-2 border rounded-xl p-3"

                  placeholder="Holiday Notice"

                />

              </div>

              <div className="mt-6">

                <label className="font-semibold">

                  Message

                </label>

                <textarea

                  rows={10}

                  value={message}

                  onChange={(e) => setMessage(e.target.value)}

                  className="w-full mt-2 border rounded-xl p-3"

                  placeholder="Type your announcement..."

                />

              </div>

              <div className="mt-6">

  <label className="font-semibold">
    Send To
  </label>

  <select
    value={audience}
    onChange={(e) => setAudience(e.target.value)}
    className="w-full mt-2 border rounded-xl p-3"
  >
    <option value="all">👥 All Customers</option>
    <option value="active">✅ Active Customers</option>
    <option value="pending">💰 Pending Payment Customers</option>
    <option value="lunch">🍛 Lunch Customers</option>
    <option value="dinner">🌙 Dinner Customers</option>
    <option value="both">🍱 Lunch + Dinner Customers</option>
  </select>

</div>

<div className="mt-8 rounded-2xl border bg-slate-50 p-6">

  <h3 className="text-xl font-bold mb-4">
    📱 WhatsApp Preview
  </h3>

  <div className="bg-white rounded-xl border p-5 whitespace-pre-wrap">

    <strong>{title || "Announcement Title"}</strong>

    <br />
    <br />

    {message || "Your announcement message will appear here..."}

  </div>

</div>

              <div className="mt-8 flex gap-4">

                <button

                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl"

                >

                  📢 Send to All

                </button>

                <button

                  className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl"

                >

                  👀 Preview

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}