import { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import getCookie from "../utils/getCookie";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Profile = () => {
  const { token, loadingToken, logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [filterRange, setFilterRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const usertypeFromCookie = getCookie("role");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() + (6 - day);
    return new Date(d.setDate(diff));
  };

  const handleStartEdit = (exp) => {
    setEditingExpenseId(exp._id);
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
    setEditProject(exp.project || "");
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
      if (editProject !== undefined) body.project = editProject;
      if (editDescription !== undefined) body.description = editDescription;
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
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
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

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#3B82F6",
      confirmButtonText: "Yes, log me out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login");
        Swal.fire("Logged out!", "You have been logged out.", "success");
      }
    });
  };

  const dateFilteredExpenses = useMemo(() => {
    if (!user?.expenses) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = getEndOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    return user.expenses.filter((exp) => {
      if (!exp || !exp.date) return false;
      const expDateObj = new Date(exp.date);
      const expDate = new Date(
        expDateObj.getFullYear(),
        expDateObj.getMonth(),
        expDateObj.getDate()
      );

      if (filterRange === "day") {
        return expDate.getTime() === today.getTime();
      }
      if (filterRange === "week") {
        return expDate >= startOfWeek && expDate <= endOfWeek;
      }
      if (filterRange === "month") {
        return expDate >= startOfMonth && expDate <= endOfMonth;
      }
      if (filterRange === "year") {
        return expDate >= startOfYear && expDate <= endOfYear;
      }
      if (filterRange === "all") {
        return true;
      }
      if (filterRange === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return expDateObj >= start && expDateObj <= end;
      }
      return true;
    });
  }, [user, filterRange, startDate, endDate]);

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
        Cookies.remove("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, loadingToken, navigate]);

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
  }, [user, currentMonth, currentYear]);

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
  }, [user, prevMonthDate]);

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
    return dateFilteredExpenses
      .filter((exp) =>
        selectedCategory === "all" ? true : exp.category === selectedCategory
      )
      .filter((exp) =>
        selectedProject === "all" ? true : exp.project === selectedProject
      );
  }, [dateFilteredExpenses, selectedCategory, selectedProject]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg shadow max-w-md mx-auto mt-10">{error}</div>;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">MY Profile</h2>
              <p className="mt-1 text-sm text-gray-500">Manage your account and expenses.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <UserCircleIcon className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-xl font-semibold text-gray-900">{user.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="font-medium text-gray-900 mt-1">{user.phone || "N/A"}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Supervisor Password</p>
                <p className="font-medium text-gray-900 mt-1">{user.password2 || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">Total Expenses This Month</p>
              <p className="text-2xl font-bold text-blue-900">
                EGP {totalMonthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {totalPrevMonth === 0 && totalMonthlyAmount > 0 ? (
                <p className="mt-2 text-sm font-medium text-green-600">
                  ▲ 100.0% compared to last month
                  <span className="text-xs text-gray-600 ml-2">(EGP {totalPrevMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </p>
              ) : percentChange !== null ? (
                // Show normal percentage change if both months have data
                <p className={`mt-2 text-sm font-medium ${percentChange > 0 ? "text-green-600" : "text-red-600"}`}>
                  {percentChange > 0 ? "▲" : "▼"} {Math.abs(percentChange).toFixed(1)}% compared to last month
                  <span className="block text-xs text-gray-600 mt-1">(EGP {totalPrevMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </p>
              ) : (
                // Show message only if there's truly no data for comparison (e.g., new user, no expenses ever)
                <p className="mt-2 text-sm text-gray-500">
                  No data for last month to compare.
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm border border-green-100">
              <p className="text-sm font-medium text-green-800 mb-1">All-Time Total</p>
              <p className="text-2xl font-bold text-green-900">
                EGP {totalAllExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8 bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Expenses</h3>

          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col w-full md:w-auto min-w-[180px]">
                <label htmlFor="profile-category-select" className="mb-1 text-sm font-medium text-gray-700">
                  Filter by Category
                </label>
                <select
                  id="profile-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                >
                  <option value="all">All Categories</option>
                  {[...new Set(user?.expenses?.map((e) => e.category) || [])].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col w-full md:w-auto min-w-[180px]">
                <label htmlFor="profile-project-select" className="mb-1 text-sm font-medium text-gray-700">
                  Filter by Project
                </label>
                <select
                  id="profile-project-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                >
                  <option value="all">All Projects</option>
                  {[...new Set(user?.expenses?.map((e) => e.project).filter(p => p) || [])].map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col w-full md:w-auto min-w-[280px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Filter by Date Range
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {["day", "week", "month", "year", "all", "custom"].map((range) => (
                  <label
                    key={range}
                    className={`flex items-center justify-center cursor-pointer select-none rounded-lg border px-3 py-2 text-xs sm:text-sm transition
                      ${filterRange === range
                        ? "bg-blue-600 border-blue-600 text-white shadow-inner"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 shadow-sm"
                      }`}
                  >
                    <input
                      type="radio"
                      name="profileDateRange"
                      value={range}
                      checked={filterRange === range}
                      onChange={(e) => setFilterRange(e.target.value)}
                      className="sr-only"
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
                                : "Custom"}
                    </span>
                  </label>
                ))}
              </div>
              {filterRange === "custom" && (
                <div className="flex flex-col sm:flex-row gap-4 mt-3">
                  <div className="flex flex-col w-full">
                    <label htmlFor="profile-start-date" className="mb-1 text-xs text-gray-600">Start Date</label>
                    <input
                      id="profile-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm w-full"
                    />
                  </div>
                  <div className="flex flex-col w-full">
                    <label htmlFor="profile-end-date" className="mb-1 text-xs text-gray-600">End Date</label>
                    <input
                      id="profile-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {filteredExpenses && filteredExpenses.length > 0 ? (
            <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExpenses
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((exp) => (
                  <li
                    key={exp._id}
                    className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md"
                  >
                    {editingExpenseId === exp._id ? (
                      <div className="p-5">
                        <div className="mb-4 space-y-3">
                          <div>
                            <label htmlFor={`edit-amount-${exp._id}`} className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                            <input
                              id={`edit-amount-${exp._id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-category-${exp._id}`} className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                            <input
                              id={`edit-category-${exp._id}`}
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-project-${exp._id}`} className="block text-xs font-medium text-gray-700 mb-1">Project</label>
                            <input
                              id={`edit-project-${exp._id}`}
                              type="text"
                              value={editProject}
                              onChange={(e) => setEditProject(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-date-${exp._id}`} className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                            <input
                              id={`edit-date-${exp._id}`}
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-description-${exp._id}`} className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              id={`edit-description-${exp._id}`}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          {editError && (
                            <p className="text-red-500 text-sm mt-1">{editError}</p>
                          )}
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={handleSaveEdit}
                            disabled={loadingEdit}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm
                              ${loadingEdit
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                              }`}
                          >
                            {loadingEdit ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loadingEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 active:bg-gray-400 transition shadow-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span
                              className={`block text-base font-semibold text-blue-600 truncate max-w-[180px]`}
                            >
                              {exp.category}
                            </span>
                            {/* {exp.project && (
                              <span className="block text-xs text-gray-500 mt-1 truncate max-w-[180px]">
                                Project: {exp.project}
                              </span>
                            )} */}
                            <span className="block text-xs text-gray-500 mt-1">
                              {new Date(exp.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-right text-lg font-bold text-green-600 shrink-0">
                            EGP {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <p className="text-gray-700 text-sm mt-3 line-clamp-2 min-h-[2.5rem]">
                          {exp.description || <span className="text-gray-400 italic">No description</span>}
                        </p>
                        {usertypeFromCookie !== "supervisor" && (
                          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleStartEdit(exp)}
                              title="Edit Expense"
                              className="p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              <PencilIcon className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp._id)}
                              disabled={loadingDelete === exp._id}
                              title="Delete Expense"
                              className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                            >
                              <TrashIcon
                                className={`w-4 h-4 ${loadingDelete === exp._id ? "text-gray-400" : "text-red-600"}`}
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
            <div className="text-center py-12">
              <p className="text-gray-500">No expenses found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;