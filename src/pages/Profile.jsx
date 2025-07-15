import { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import getCookie from "../utils/getCookie";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { token, loadingToken } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [filterRange, setFilterRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const usertypeFromCookie = getCookie("role");

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const handleStartEdit = (exp) => {
    setEditingExpenseId(exp._id);
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
    setEditDescription(exp.description || "");
    setEditDate(exp.date ? exp.date.split("T")[0] : "");
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    setEditError(null);
    setLoadingEdit(true);
    try {
      const body = {};
      if (editAmount) body.amount = Number(editAmount);
      if (editCategory) body.category = editCategory;
      if (editDescription) body.description = editDescription;
      if (editDate) body.date = editDate;

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/expenses/${editingExpenseId}`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser((prev) => ({
        ...prev,
        expenses: prev.expenses.map((exp) =>
          exp._id === editingExpenseId
            ? {
                ...exp,
                ...res.data.expense,
                date: res.data.expense.date || exp.date,
              }
            : exp
        ),
      }));

      setEditingExpenseId(null);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update expense.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This expense will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3342f",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setDeleteError(null);
    setLoadingDelete(id);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((exp) => exp._id !== id),
      }));

      Swal.fire({
        title: "Deleted!",
        text: "Expense has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Failed to delete expense."
      );
      Swal.fire({
        title: "Error!",
        text:
          err.response?.data?.message ||
          "Something went wrong during deletion.",
        icon: "error",
      });
    } finally {
      setLoadingDelete(null);
    }
  };

  const dateFilteredExpenses = useMemo(() => {
    if (!user?.expenses) return [];

    const now = new Date();
    const today = now.toDateString();

    return user.expenses.filter((exp) => {
      if (!exp || !exp.date) return false;
      const expDate = new Date(exp.date);
      const expDay = expDate.toDateString();

      if (filterRange === "day") {
        return expDay === today;
      }

      if (filterRange === "week") {
        const firstDayOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        );
        const lastDayOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 6
        );
        return expDate >= firstDayOfWeek && expDate <= lastDayOfWeek;
      }

      if (filterRange === "month") {
        return (
          expDate.getMonth() === new Date().getMonth() &&
          expDate.getFullYear() === new Date().getFullYear()
        );
      }

      if (filterRange === "year") {
        return expDate.getFullYear() === new Date().getFullYear();
      }

      if (filterRange === "all") {
        return true;
      }

      if (filterRange === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return expDate >= start && expDate <= end;
      }

      return true;
    });
  }, [user, filterRange, startDate, endDate]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingToken && !token) {
      navigate("/login");
      return;
    }
    if (loadingToken || !token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/getUser`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(res.data.user);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, loadingToken]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonthDate = new Date(currentYear, currentMonth - 1);

  const monthlyExpenses = useMemo(() => {
    return (
      user?.expenses?.filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate.getMonth() === currentMonth &&
          expDate.getFullYear() === currentYear
        );
      }) || []
    );
  }, [user]);

  const prevMonthlyExpenses = useMemo(() => {
    return (
      user?.expenses?.filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate.getMonth() === prevMonthDate.getMonth() &&
          expDate.getFullYear() === prevMonthDate.getFullYear()
        );
      }) || []
    );
  }, [user]);

  const totalMonthlyAmount = useMemo(() => {
    return monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [monthlyExpenses]);

  const totalPrevMonth = useMemo(() => {
    return prevMonthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [prevMonthlyExpenses]);

  const percentChange =
    totalPrevMonth > 0
      ? ((totalMonthlyAmount - totalPrevMonth) / totalPrevMonth) * 100
      : null;

  const totalAllExpenses = useMemo(() => {
    return user?.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  }, [user?.expenses]);

  const filteredExpenses = useMemo(() => {
    return dateFilteredExpenses.filter((exp) =>
      selectedCategory === "all" ? true : exp.category === selectedCategory
    );
  }, [dateFilteredExpenses, selectedCategory]);

  const chartData = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      total: 0,
    }));
    user?.expenses?.forEach((exp) => {
      const d = new Date(exp.date);
      if (d.getFullYear() === currentYear)
        monthlyData[d.getMonth()].total += exp.amount;
    });
    return monthlyData.map((d) => ({
      name: new Date(0, d.month).toLocaleString("default", { month: "short" }),
      total: d.total,
    }));
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="sm:py-10">
      <div className="max-w-7xl mx-auto rounded-xl p-6">
        <h2 className="text-3xl font-bold text-textMain mb-6 font-kanit">
          User Profile
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <UserCircleIcon className="w-14 h-14 text-gray-700" />
          <div>
            <p className="text-xl font-semibold">{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-lg">{user.phone}</p>
          </div>
          <div className="p-4 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-500">Supervisor Password</p>
            <p className="font-medium">{user.password2}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-8">
          <div className="p-4 border rounded-md bg-blue-50">
            <p className="pb-2 text-sm text-gray-600">
              Total Expenses This Month
            </p>
            <p className="text-2xl font-bold text-blue-700">
              EGP {totalMonthlyAmount}
            </p>
            {percentChange !== null ? (
              <p
                className={`mt-1 text-sm font-medium ${
                  percentChange > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {percentChange > 0 ? "▲" : "▼"}{" "}
                {Math.abs(percentChange).toFixed(1)}% compared to last month
                (EGP {totalPrevMonth})
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                No data for last month to compare.
              </p>
            )}
          </div>

          <div className="p-4 border rounded-md bg-green-50">
            <p className="pb-2 text-sm text-gray-600">All-Time Total</p>
            <p className="text-2xl font-bold text-green-700">
              EGP {totalAllExpenses}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-4">Recent Expenses</h3>
          {/* filter */}
          <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-6">
            {/* Filter by Category */}
            <div className="flex flex-col w-full sm:w-auto min-w-[180px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">All Categories</option>
                {[...new Set(user.expenses?.map((e) => e.category))].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Filter by Date - Radio Buttons */}
            <div className="flex flex-col w-full sm:w-auto min-w-[280px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
                {["day", "week", "month", "year", "all", "custom"].map(
                  (range) => (
                    <label
                      key={range}
                      className={`flex items-center cursor-pointer select-none rounded-md border px-3 py-2 transition
        ${
          filterRange === range
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
        }`}
                    >
                      <input
                        type="radio"
                        name="dateRange"
                        value={range}
                        checked={filterRange === range}
                        onChange={(e) => setFilterRange(e.target.value)}
                        className="hidden"
                      />
                      <span className="capitalize">
                        {range === "day"
                          ? "Today"
                          : range === "week"
                          ? "This Week"
                          : range === "month"
                          ? "This Month"
                          : range === "year"
                          ? "This Year"
                          : range === "all"
                          ? "All Time"
                          : "Custom Range"}
                      </span>
                    </label>
                  )
                )}
              </div>

              {filterRange === "custom" && (
                <div className="flex gap-4 mt-3 flex-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full sm:w-auto"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full sm:w-auto"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>
          </div>

          {filteredExpenses && filteredExpenses.length > 0 ? (
            <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {filteredExpenses
                .slice(0, 6)
                .reverse()
                .map((exp) => (
                  <li
                    key={exp._id}
                    className="rounded-xl border border-slate-200 bg-white shadow-md p-6 relative"
                  >
                    {editingExpenseId === exp._id ? (
                      <>
                        <div className="mb-3 space-y-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full border px-3 py-2 rounded-md"
                          />
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full border px-3 py-2 rounded-md"
                          />
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full border px-3 py-2 rounded-md"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                            className="w-full border px-3 py-2 rounded-md"
                          />
                          {editError && (
                            <p className="text-red-500 text-sm">{editError}</p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveEdit}
                            disabled={loadingEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {loadingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loadingEdit}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {/* Category */}
                        <span
                          className={`block text-base font-semibold text-blue-600 ${
                            /[\u0600-\u06FF]/.test(exp.category)
                              ? "font-Rubik"
                              : ""
                          }`}
                        >
                          {exp.category}
                        </span>

                        {/* Date */}
                        <span className="block text-sm text-gray-400">
                          {new Date(exp.date).toLocaleDateString()}
                        </span>

                        {/* Description */}
                        <p
                          className={`text-gray-700 text-sm line-clamp-2 ${
                            /[\u0600-\u06FF]/.test(exp.description)
                              ? "font-Rubik"
                              : ""
                          }`}
                        >
                          {exp.description}
                        </p>

                        {/* Amount */}
                        <p className="text-right text-lg font-bold text-green-600">
                          EGP {exp.amount}
                        </p>

                        {/* Action Buttons */}
                        {usertypeFromCookie !== "supervisor" && (
                          <div className="flex items-center justify-end gap-3 pt-2 border-t mt-2">
                            <button
                              onClick={() => handleStartEdit(exp)}
                              title="Edit Expense"
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <PencilIcon className="w-5 h-5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp._id)}
                              disabled={loadingDelete === exp._id}
                              title="Delete Expense"
                              className="p-1 rounded hover:bg-red-200"
                            >
                              <TrashIcon
                                className={`w-5 h-5 ${
                                  loadingDelete === exp._id
                                    ? "text-gray-400"
                                    : "text-red-600"
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-500">No expenses recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
