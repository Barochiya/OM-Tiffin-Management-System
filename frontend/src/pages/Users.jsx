import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  Clock3,
  UserRound,
  Smartphone,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { getCustomerUsers } from "../services/customerUsersService";
export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await getCustomerUsers();
      if (response?.success) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setUsers([]);
        setError(
          response?.message || "Unable to load customer users."
        );
      }
    } catch (err) {
      console.error("Users page load error:", err);
      setUsers([]);
      setError(
        err?.response?.data?.message ||
          "Unable to load customer users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    let isMounted = true;
    const loadInitialUsers = async () => {
      if (!isMounted) return;
      await loadUsers();
    };
    loadInitialUsers();
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        loadUsers(false);
      }
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => {
      return (
        user.customerName?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.userId?.toLowerCase().includes(query) ||
        user.barcode?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);
  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  return (
    <div className="w-full max-w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <UsersIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Users
              </h1>
              <p className="text-sm text-slate-500">
                Customers who have successfully logged in
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadUsers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Logged-in Customers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {users.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersIcon size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Showing
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {filteredUsers.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BadgeCheck size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Search Result
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {search.trim() ? filteredUsers.length : "All"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Search size={24} />
            </div>
          </div>
        </div>
      </div>
      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full">
          <Search
            size={19}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile, User ID or barcode..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Unable to load Users
            </p>
            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}
      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading users...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <UsersIcon
            size={42}
            className="mx-auto text-slate-300"
          />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">
            No logged-in customers found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Customers will appear here after their first successful login.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      User ID / Barcode
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Mobile
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      First Login
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Last Login
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={`${user.userId}-${user.customerId}`}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <UserRound size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {user.customerName || "Unnamed Customer"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.userId || "—"}
                          </p>
                          {user.barcode &&
                            user.barcode !== user.userId && (
                              <p className="mt-1 text-xs text-slate-500">
                                Barcode: {user.barcode}
                              </p>
                            )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.phone || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock3
                            size={16}
                            className="text-blue-500"
                          />
                          {formatDateTime(user.firstLoginAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock3
                            size={16}
                            className="text-emerald-500"
                          />
                          {formatDateTime(user.lastLoginAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            user.loginEnabled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {user.loginEnabled
                            ? "Login Enabled"
                            : "Login Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile / Tablet Cards */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredUsers.map((user) => (
              <div
                key={`${user.userId}-${user.customerId}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <UserRound size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-800">
                        {user.customerName || "Unnamed Customer"}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-blue-600">
                        {user.userId || "—"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.loginEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.loginEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Smartphone size={15} />
                      Mobile
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {user.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <BadgeCheck size={15} />
                      Barcode
                    </div>
                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                      {user.barcode || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      <Clock3 size={15} />
                      First Login
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDateTime(user.firstLoginAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      <Clock3 size={15} />
                      Last Login
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDateTime(user.lastLoginAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

