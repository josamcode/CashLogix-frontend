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
} from "recharts";
import Swal from "sweetalert2";
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  LightBulbIcon, // For insights
} from "@heroicons/react/24/outline";
import getCookie from "../utils/getCookie";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

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

// --- Enhanced CSV Export ---
const exportToCSV = (expenses, user) => {
  if (!expenses.length) return;
  const headers = ["Date", "Category", "Project", "Description", "Amount", "User"];
  const rows = expenses.map(({ date, category, project, description, amount }) => [
    new Date(date).toLocaleDateString(),
    category,
    project || "",
    description || "",
    amount,
    user.username, // Include user info in export
  ]);
  const csvArray = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const csvContent = "\uFEFF" + csvArray; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `expenses_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// --- Insight Generation Logic ---
const calculateInsights = (expenses, user) => {
  const insights = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Filter recent expenses
  const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
  const totalRecent = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgDaily = totalRecent / 30;

  // Insight 1: High average daily spending
  if (avgDaily > 100) { // Threshold can be adjusted or made dynamic
    insights.push({
      type: "warning",
      message: `Your daily average spending over the last 30 days is high (EGP ${avgDaily.toFixed(2)}). Consider reviewing your budget.`,
    });
  }

  // Insight 2: Dominant spending category
  const categories = [...new Set(expenses.map(e => e.category))];
  const categoryTotals = categories.map(cat => ({
    name: cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).sort((a, b) => b.total - a.total);

  if (categoryTotals.length > 0 && (categoryTotals[0].total / (totalRecent || 1)) > 0.4) { // >40% of recent spending
    insights.push({
      type: "info",
      message: `A large portion of your spending is on ${categoryTotals[0].name}. Review if this aligns with your priorities.`,
    });
  }

  // --- Project-Specific Insights ---
  const projects = [...new Set(expenses.map(e => e.project).filter(p => p))];
  if (projects.length > 0) {
    const projectExpenses = projects.map(proj => ({
      name: proj,
      total: expenses.filter(e => e.project === proj).reduce((sum, e) => sum + e.amount, 0)
    })).sort((a, b) => b.total - a.total);

    // Insight 3: Most expensive project
    if (projectExpenses.length > 0) {
      insights.push({
        type: "info",
        message: `Your project "${projectExpenses[0].name}" has the highest expenses (EGP ${projectExpenses[0].total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
      });
    }
  }

  // --- Future Ideas for Insights ---
  // - Recurring expenses detection
  // - Budget vs actual (if budgets are implemented)
  // - Comparison to user segments (requires backend data)
  // - Spending patterns (e.g., "You tend to spend more on weekends")

  return insights;
};

const Reports = () => {
  const { token, loadingToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [filterRange, setFilterRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [insights, setInsights] = useState([]); // State for insights
  const usertypeFromCookie = getCookie("role");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingToken && !token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/getUser`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(res.data.user);
        // Calculate insights once user data is fetched
        setInsights(calculateInsights(res.data.user.expenses || [], res.data.user));
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
  }, [token, loadingToken]); // Dependencies ensure it runs when token changes

  // --- Memoized Data Processing ---
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
      const expDate = new Date(expDateObj.getFullYear(), expDateObj.getMonth(), expDateObj.getDate());

      if (filterRange === "day") return expDate.getTime() === today.getTime();
      if (filterRange === "week") return expDate >= startOfWeek && expDate <= endOfWeek;
      if (filterRange === "month") return expDate >= startOfMonth && expDate <= endOfMonth;
      if (filterRange === "year") return expDate >= startOfYear && expDate <= endOfYear;
      if (filterRange === "all") return true;
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
      .filter((exp) => selectedCategory === "all" ? true : exp.category === selectedCategory)
      .filter((exp) => selectedProject === "all" ? true : exp.project === selectedProject);
  }, [dateFilteredExpenses, selectedCategory, selectedProject]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const averageAmount = useMemo(() => {
    const count = filteredExpenses.length;
    return count > 0 ? totalAmount / count : 0;
  }, [filteredExpenses, totalAmount]);

  const expensesByCategory = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({ name: category, value: amount }));
  }, [filteredExpenses]);

  const expensesByProject = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((exp) => {
      if (exp.project) {
        map[exp.project] = (map[exp.project] || 0) + exp.amount;
      }
    });
    return Object.entries(map).map(([project, amount]) => ({ name: project, value: amount }));
  }, [filteredExpenses]);

  const expensesByMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyTotals = Array(12).fill(0);
    filteredExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d.getFullYear() === currentYear) {
        monthlyTotals[d.getMonth()] += exp.amount;
      }
    });
    return monthlyTotals.map((total, idx) => ({
      month: new Date(0, idx).toLocaleString("default", { month: "short" }),
      total,
    }));
  }, [filteredExpenses]);

  const barChartData = useMemo(() => expensesByCategory, [expensesByCategory]);

  const sortedExpensesByCategory = useMemo(() => {
    const sortedData = [...expensesByCategory];
    sortedData.sort((a, b) => b.value - a.value);
    return sortedData;
  }, [expensesByCategory]);

  // --- New Data for Enhanced Visualizations ---
  const topCategories = useMemo(() => sortedExpensesByCategory.slice(0, 5), [sortedExpensesByCategory]);

  const cumulativeExpensesData = useMemo(() => {
    const sorted = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulative = 0;
    return sorted.map(exp => {
      cumulative += exp.amount;
      return { date: new Date(exp.date).toLocaleDateString(), cumulative };
    });
  }, [filteredExpenses]);

  const categoryRadarData = useMemo(() => {
    const max = Math.max(...expensesByCategory.map(d => d.value), 1); // Avoid division by zero
    return expensesByCategory.map(d => ({ subject: d.name, A: (d.value / max) * 100 }));
  }, [expensesByCategory]);

  // --- Re-fetch insights if filters change ---
  useEffect(() => {
    if (user) {
      setInsights(calculateInsights(filteredExpenses, user));
    }
  }, [filteredExpenses, user]); // Depend on filtered expenses

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg shadow max-w-md mx-auto mt-10">
      {error}
    </div>
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <LightBulbIcon className="h-8 w-8 text-yellow-500" /> {/* Insight Icon */}
            Expense Analytics Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">Gain deep insights into your spending patterns.</p>
        </div>

        {/* Filter Section */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            {/* Category & Project Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <div className="flex flex-col w-full sm:w-48">
                <label htmlFor="category-select" className="mb-1 text-sm font-medium text-gray-700">
                  Filter by Category
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm"
                >
                  <option value="all">All Categories</option>
                  {[...new Set(user?.expenses?.map((e) => e.category) || [])].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-full sm:w-48">
                <label htmlFor="project-select" className="mb-1 text-sm font-medium text-gray-700">
                  Filter by Project
                </label>
                <select
                  id="project-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm"
                >
                  <option value="all">All Projects</option>
                  {[...new Set(user?.expenses?.map((e) => e.project).filter(p => p) || [])].map((proj) => (
                    <option key={proj} value={proj}>{proj}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range & Export */}
            <div className="flex flex-col flex-grow">
              <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
                {/* Date Range Filter */}
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
                          {range === "day" ? "Today" : range === "week" ? "Week" : range === "month" ? "Month" : range === "year" ? "Year" : range === "all" ? "All Time" : "Custom"}
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
                    title={filteredExpenses.length === 0 ? "No data to export" : "Export to CSV"}
                  >
                    Export CSV
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-blue-900 truncate">
                EGP {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 shadow-sm border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-1">Number of Transactions</p>
              <p className="text-2xl font-bold text-amber-900">{filteredExpenses.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-sm border border-purple-100">
              <p className="text-sm font-medium text-purple-800 mb-1">Average Expense</p>
              <p className="text-2xl font-bold text-purple-900 truncate">
                EGP {averageAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="px-6 py-4 sm:px-8 sm:py-6 bg-yellow-50 border-t border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5" />
              Actionable Insights
            </h3>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className={`inline-block w-3 h-3 rounded-full mt-1.5 mr-2 ${insight.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                  <span className="text-sm text-yellow-700">{insight.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charts Section */}
        <div className="px-6 py-6 sm:px-8 sm:py-8 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {/* Spending by Category (Pie Chart) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 lg:col-span-2 xl:col-span-1">
              <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                Spending by Category
              </h3>
              {sortedExpensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={sortedExpensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {sortedExpensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name, props) => {
                        const total = sortedExpensesByCategory.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? (value / total) * 100 : 0;
                        return [
                          <>
                            EGP {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <br />
                            <span style={{ fontSize: '0.8em' }}>({percent.toFixed(1)}%)</span>
                          </>,
                          'Amount'
                        ];
                      }}
                      labelFormatter={(name) => `Category: ${name}`}
                      contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <p>No data available for this period/category.</p>
                </div>
              )}
            </div>

            {/* Spending by Project (Pie Chart) */}
            {expensesByProject.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 lg:col-span-2 xl:col-span-1">
                <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                  Spending by Project
                </h3>
                {expensesByProject.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={expensesByProject}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByProject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                        contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-64 text-gray-500">
                    <p>No project data available for this period/category.</p>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Trends (Area Chart) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                Monthly Trends (This Year)
              </h3>
              {expensesByMonth.some((d) => d.total > 0) ? (
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={expensesByMonth}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [`EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                      contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#93C5FD" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <p>No data available for this period/category.</p>
                </div>
              )}
            </div>

            {/* Top Spending Categories (Bar Chart) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 lg:col-span-2 xl:col-span-1">
              <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                Top Spending Categories
              </h3>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={topCategories}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [`EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                      contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <p>No data available for this period/category.</p>
                </div>
              )}
            </div>

            {/* Cumulative Spending (Line Chart) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                Cumulative Spending
              </h3>
              {cumulativeExpensesData.length > 1 ? ( // Need at least 2 points
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={cumulativeExpensesData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [`EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Cumulative Amount']}
                      contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                    />
                    <Line type="monotone" dataKey="cumulative" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <p>Insufficient data for trend analysis.</p>
                </div>
              )}
            </div>

            {/* Category Distribution Radar (Radar Chart) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 lg:col-span-2 xl:col-span-1">
              <h3 className="mb-4 font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">
                Category Distribution Radar
              </h3>
              {categoryRadarData.length > 2 ? ( // Radar needs at least 3 points
                <ResponsiveContainer width="100%" height={380}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Category" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <p>Need at least 3 categories for radar chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;