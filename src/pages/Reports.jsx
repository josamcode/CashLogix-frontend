import { useTranslation } from 'react-i18next';
import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid
} from "recharts";
import Swal from "sweetalert2";
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import getCookie from "../utils/getCookie";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

// Define chart colors
const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

const Reports = () => {
  const { t } = useTranslation();
  const { token, loadingToken } = useContext(AuthContext);
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

  // - Date Utilities -
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);

    if (day === 0) {
      startOfWeek.setDate(startOfWeek.getDate() - 7);
    }

    return startOfWeek;
  };

  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  };

  // - Enhanced CSV Export Function -
  const exportToCSV = (expenses, user) => {
    if (!expenses || !expenses.length) {
      Swal.fire(t("error"), t("no_data_to_export"), "warning");
      return;
    }

    try {
      const headers = [
        t("date"),
        t("category"),
        t("project"),
        t("description"),
        t("amount"),
        t("user")
      ];

      const rows = expenses.map(({ date, category, project, description, amount }) => [
        new Date(date).toLocaleDateString(),
        category,
        project || t("no_project"),
        description || t("no_description"),
        amount,
        user?.username || t("na")
      ]);

      const csvArray = [headers, ...rows]
        .map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const csvContent = "\uFEFF" + csvArray; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      Swal.fire(t("error"), t("error_exporting_data"), "error");
    }
  };

  // - Edit/Delete Handlers -
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
      setEditError(
        err.response?.data?.message || t("error_update_expense")
      );
    } finally {
      setLoadingEdit(false);
    }
  };
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t("delete_confirm_title"),
      text: t("delete_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: t("yes_delete_it"),
      cancelButtonText: t("cancel"),
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
        title: t("deleted"),
        text: t("expense_deleted"),
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || t("error_delete_expense");
      setDeleteError(errorMsg);

      Swal.fire({
        title: t("error"),
        text: errorMsg,
        icon: "error",
      });
    } finally {
      setLoadingDelete(null);
    }
  };

  // - Data Fetching -
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
        setError(err.response?.data?.message || t("error_generic"));
        setUser(null);
        Cookies.remove("token");
        window.location.reload();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, loadingToken, t]);

  // - Memoized Data Processing -
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

  const filteredExpenses = useMemo(() => {
    return dateFilteredExpenses
      .filter((exp) =>
        selectedCategory === "all" ? true : exp.category === selectedCategory
      )
      .filter((exp) =>
        selectedProject === "all" ? true : exp.project === selectedProject
      );
  }, [dateFilteredExpenses, selectedCategory, selectedProject]);

  const expensesByCategory = useMemo(() => {
    const categoryMap = {};
    filteredExpenses.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredExpenses]);

  const sortedExpensesByCategory = useMemo(() => {
    return [...expensesByCategory].sort((a, b) => b.value - a.value);
  }, [expensesByCategory]);

  const expensesByProject = useMemo(() => {
    const projectMap = {};
    filteredExpenses.forEach((exp) => {
      const proj = exp.project || t("no_project");
      projectMap[proj] = (projectMap[proj] || 0) + exp.amount;
    });
    return Object.entries(projectMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredExpenses, t]);

  // - New Data for Enhanced Visualizations -
  const topCategories = useMemo(
    () => sortedExpensesByCategory.slice(0, 5),
    [sortedExpensesByCategory]
  );

  const cumulativeExpensesData = useMemo(() => {
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    let cumulative = 0;
    return sorted.map((exp) => {
      cumulative += exp.amount;
      return {
        date: new Date(exp.date).toLocaleDateString(),
        cumulative,
      };
    });
  }, [filteredExpenses]);

  const categoryRadarData = useMemo(() => {
    const max = Math.max(
      ...expensesByCategory.map((d) => d.value),
      1
    ); // Avoid division by zero
    return expensesByCategory.map((d) => ({
      category: d.name,
      value: (d.value / max) * 100, // Normalize to 0-100 for radar
    }));
  }, [expensesByCategory]);

  // - Insights Generation -
  const insights = useMemo(() => {
    const insightsList = [];
    if (filteredExpenses.length === 0) {
      insightsList.push({
        type: "info",
        message: t("insight_no_expenses"),
      });
      return insightsList;
    }

    // Insight 1: Highest spending category
    if (sortedExpensesByCategory.length > 0) {
      insightsList.push({
        type: "warning",
        message: t("insight_highest_spending_category", {
          category: sortedExpensesByCategory[0].name,
          currency: user?.currency || "EGP",
          amount: sortedExpensesByCategory[0].value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        }),
      });
    }

    // Insight 2: Total expenses
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    insightsList.push({
      type: "info",
      message: t("insight_total_expenses", {
        currency: user?.currency || "EGP",
        amount: totalExpenses.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }),
    });

    // Insight 3: Project spending (if projects exist)
    if (
      usertypeFromCookie === "entrepreneur" ||
      user?.usertype === "entrepreneur"
    ) {
      const uniqueProjects = [
        ...new Set(
          filteredExpenses.map((e) => e.project).filter((p) => p && p.trim())
        ),
      ];
      const projectExpenses = uniqueProjects.map((proj) => ({
        name: proj,
        total: filteredExpenses
          .filter((e) => e.project === proj)
          .reduce((sum, e) => sum + e.amount, 0),
      })).sort((a, b) => b.total - a.total);

      if (projectExpenses.length > 0) {
        insightsList.push({
          type: "info",
          message: t("insight_highest_spending_project", {
            project: projectExpenses[0].name,
            currency: user?.currency || "EGP",
            amount: projectExpenses[0].total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          }),
        });
      }
    }

    return insightsList;
  }, [
    filteredExpenses,
    sortedExpensesByCategory,
    user?.currency,
    usertypeFromCookie,
    user?.usertype,
    t,
  ]);

  // - Chart Colors -
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  const RADAR_COLORS = ["#8884D8"];

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg shadow max-w-md mx-auto mt-10">
        {error}
      </div>
    );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("expense_analytics_dashboard")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("gain_deep_insights")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="px-6 py-6 sm:px-8 sm:py-8 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Filters Section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 flex-grow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex flex-col w-full md:w-auto min-w-[180px]">
                  <label
                    htmlFor="reports-category-select"
                    className="mb-1 text-sm font-medium text-gray-700"
                  >
                    {t("filter_by_category")}
                  </label>
                  <select
                    id="reports-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                  >
                    <option value="all">{t("all_categories")}</option>
                    {[...new Set(user?.expenses?.map((e) => e.category) || [])].map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Project Filter (Conditional) */}
                {(usertypeFromCookie === "entrepreneur" ||
                  user?.usertype === "entrepreneur") && (
                    <div className="flex flex-col w-full md:w-auto min-w-[180px]">
                      <label
                        htmlFor="reports-project-select"
                        className="mb-1 text-sm font-medium text-gray-700"
                      >
                        {t("filter_by_project")}
                      </label>
                      <select
                        id="reports-project-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="all">{t("all_projects")}</option>
                        {[
                          ...new Set(
                            user?.expenses
                              ?.map((e) => e.project)
                              .filter((p) => p)
                              .filter((p) => p.trim() !== "") || []
                          ),
                        ].map((proj) => (
                          <option key={proj} value={proj}>
                            {proj}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col w-full md:w-auto min-w-[280px]">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  {t("filter_by_date_range")}
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
                        name="reportsDateRange"
                        value={range}
                        checked={filterRange === range}
                        onChange={(e) => setFilterRange(e.target.value)}
                        className="sr-only"
                      />
                      <span className="capitalize">
                        {/* Translated range labels */}
                        {range === "day"
                          ? t("today")
                          : range === "week"
                            ? t("this_week")
                            : range === "month"
                              ? t("this_month")
                              : range === "year"
                                ? t("this_year")
                                : range === "all"
                                  ? t("all_time")
                                  : t("custom")}
                      </span>
                    </label>
                  ))}
                </div>
                {filterRange === "custom" && (
                  <div className="flex flex-col sm:flex-row gap-4 mt-3">
                    <div className="flex flex-col w-full">
                      <label
                        htmlFor="reports-start-date"
                        className="mb-1 text-xs text-gray-600"
                      >
                        {t("start_date")}
                      </label>
                      <input
                        id="reports-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm w-full"
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label
                        htmlFor="reports-end-date"
                        className="mb-1 text-xs text-gray-600"
                      >
                        {t("end_date")}
                      </label>
                      <input
                        id="reports-end-date"
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

            {/* Export Button */}
            <div className="mt-6 md:mt-0 md:ml-auto">
              <button
                onClick={() => exportToCSV(filteredExpenses, user)} // Pass user for export
                disabled={filteredExpenses.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap
                  ${filteredExpenses.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                  }`}
                title={
                  filteredExpenses.length === 0
                    ? t("no_data_to_export")
                    : t("export_to_csv")
                }
              >
                {t("export_to_csv")}
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            {t("financial_insights")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${insight.type === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
                  }`}
              >
                <p
                  className={`text-sm ${insight.type === "warning"
                    ? "text-yellow-800"
                    : "text-blue-800"
                    }`}
                >
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="px-6 py-6 sm:px-8 sm:py-8 direction-ltr">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Pie Chart - Expenses by Category */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("expenses_by_category")}
              </h3>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) =>
                        `${user?.currency || "EGP"} ${Number(value).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-10">
                  {t("no_data_available")}
                </p>
              )}
            </div>

            {/* Bar Chart - Top Categories */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("top_5_categories")}
              </h3>
              {topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topCategories}
                    margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) =>
                        `${user?.currency || "EGP"} ${Number(value).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}`
                      }
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-10">
                  {t("no_data_available")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Line Chart - Cumulative Expenses */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("cumulative_expenses_over_time")}
              </h3>
              {cumulativeExpensesData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={cumulativeExpensesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) =>
                        `${user?.currency || "EGP"} ${Number(value).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-10">
                  {t("not_enough_data_for_trend")}
                </p>
              )}
            </div>

            {/* Radar Chart - Category Comparison */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("category_comparison_radar")}
              </h3>
              {categoryRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={categoryRadarData}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Category"
                      dataKey="value"
                      stroke={RADAR_COLORS[0]}
                      fill={RADAR_COLORS[0]}
                      fillOpacity={0.6}
                    />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-10">
                  {t("no_data_available")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expenses List Section */}
        <div className="px-6 py-6 sm:px-8 sm:py-8 bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {t("filtered_expenses_list")}
          </h3>
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
                      // Edit Form
                      <div className="p-5">
                        <div className="mb-4 space-y-3">
                          <div>
                            <label
                              htmlFor={`edit-amount-${exp._id}`}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {t("amount")}
                            </label>
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
                            <label
                              htmlFor={`edit-category-${exp._id}`}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {t("category")}
                            </label>
                            <input
                              id={`edit-category-${exp._id}`}
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          {(usertypeFromCookie === "entrepreneur" ||
                            user?.usertype === "entrepreneur") && (
                              <div>
                                <label
                                  htmlFor={`edit-project-${exp._id}`}
                                  className="block text-xs font-medium text-gray-700 mb-1"
                                >
                                  {t("project")}
                                </label>
                                <input
                                  id={`edit-project-${exp._id}`}
                                  type="text"
                                  value={editProject}
                                  onChange={(e) => setEditProject(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                                />
                              </div>
                            )}
                          <div>
                            <label
                              htmlFor={`edit-date-${exp._id}`}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {t("date")}
                            </label>
                            <input
                              id={`edit-date-${exp._id}`}
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`edit-description-${exp._id}`}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {t("description")}
                            </label>
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
                            {loadingEdit ? t("saving") : t("save")}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loadingEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 active:bg-gray-400 transition shadow-sm disabled:opacity-50"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Expense Display
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span
                              className={`block text-base font-semibold text-blue-600 truncate max-w-[180px]`}
                            >
                              {exp.category}
                            </span>
                            <span className="block text-xs text-gray-500 mt-1">
                              {new Date(exp.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-right text-lg font-bold text-green-600 shrink-0">
                            {user?.currency || "EGP"}{" "}
                            {exp.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <p className="text-gray-700 text-sm mt-3 line-clamp-2 min-h-[2.5rem]">
                          {exp.description || (
                            <span className="text-gray-400 italic">
                              {t("no_description")} {/* Translated placeholder */}
                            </span>
                          )}
                        </p>
                        {usertypeFromCookie !== "supervisor" &&
                          user?.usertype !== "supervisor" && (
                            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleStartEdit(exp)}
                                title={t("edit_expense")}
                                className="p-2 rounded-lg hover:bg-gray-100 transition"
                              >
                                <PencilIcon className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDelete(exp._id)}
                                disabled={loadingDelete === exp._id}
                                title={t("delete_expense")}
                                className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                              >
                                <TrashIcon
                                  className={`w-4 h-4 ${loadingDelete === exp._id
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
            <div className="text-center py-12">
              <p className="text-gray-500">
                {t("no_expenses_found_filters")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;