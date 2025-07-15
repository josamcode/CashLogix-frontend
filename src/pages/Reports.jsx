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
} from "recharts";
import Swal from "sweetalert2";
import {
  PencilIcon,
  TrashIcon,
  ArrowTurnDownLeftIcon,
} from "@heroicons/react/24/outline";
import getCookie from "../utils/getCookie";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#CD6155",
  "#5499C7",
  "#48C9B0",
  "#F4D03F",
  "#E67E22",
];

const exportToCSV = (expenses) => {
  if (!expenses.length) return;
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map(({ date, category, description, amount }) => [
    new Date(date).toLocaleDateString(),
    category,
    description || "",
    amount,
  ]);

  const csvArray = [headers, ...rows].map((e) => e.join(",")).join("\n");

  const csvContent = "\uFEFF" + csvArray;

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

const Reports = () => {
  const { token, loadingToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterRange, setFilterRange] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const usertypeFromCookie = getCookie("role");

  const navigate = useNavigate();
  // Fetch user and expenses on mount
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

  // Filter expenses by date range
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
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }

      if (filterRange === "year") {
        return expDate.getFullYear() === now.getFullYear();
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

  // Filter by category
  const filteredExpenses = useMemo(() => {
    return dateFilteredExpenses.filter((exp) =>
      selectedCategory === "all" ? true : exp.category === selectedCategory
    );
  }, [dateFilteredExpenses, selectedCategory]);

  // Summary stats
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  // Expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [filteredExpenses]);

  // Expenses by month for line chart (current year)
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

  // Expenses by category for bar chart (detailed amounts)
  const barChartData = expensesByCategory;

  if (loading) return <div className="p-8 text-center">Loading report...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="py-6 sm:py-10 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Expenses Reports</h2>

      {/* Filters */}
      <section className="mb-8 flex flex-wrap gap-6 items-end">
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
            {[...new Set(user.expenses?.map((e) => e.category))].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Date - Radio Buttons */}
        <div className="flex flex-col w-full sm:w-auto min-w-[280px]">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
            {["day", "week", "month", "year", "all", "custom"].map((range) => (
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
            ))}
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

        <button
          onClick={() => exportToCSV(filteredExpenses)}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          title="Export to CSV"
        >
          Export CSV
          <ArrowTurnDownLeftIcon className="w-5 h-5" />
        </button>
      </section>

      {/* Summary */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded p-4 shadow">
          <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-700">
            EGP {totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-yellow-50 rounded p-4 shadow">
          <p className="text-sm text-gray-600 mb-2">Number of Expenses</p>
          <p className="text-2xl font-bold text-yellow-700">
            {filteredExpenses.length}
          </p>
        </div>

        <div className="bg-purple-50 rounded p-4 shadow">
          <p className="text-sm text-gray-600 mb-2">Average Expense</p>
          <p className="text-2xl font-bold text-purple-700">
            {filteredExpenses.length > 0
              ? (totalAmount / filteredExpenses.length).toFixed(2)
              : 0}
          </p>
        </div>
      </section>

      {/* Charts */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pie Chart - Expenses by Category */}
        <div className="bg-white rounded p-4 shadow">
          <h3 className="mb-4 font-semibold text-lg text-gray-700">
            Expenses by Category
          </h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  dataKey="amount"
                  isAnimationActive={false}
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) =>
                    `${entry.category} (${(
                      (entry.amount / totalAmount) *
                      100
                    ).toFixed(1)}%)`
                  }
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center">No data to display.</p>
          )}
        </div>

        {/* Line Chart - Expenses by Month (current year) */}
        <div className="bg-white rounded p-4 shadow">
          <h3 className="mb-4 font-semibold text-lg text-gray-700">
            Monthly Expenses (This Year)
          </h3>
          {expensesByMonth.some((d) => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={expensesByMonth}>
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center">No data to display.</p>
          )}
        </div>

        {/* Bar Chart - Expenses by Category */}
        <div className="bg-white rounded p-4 shadow">
          <h3 className="mb-4 font-semibold text-lg text-gray-700">
            Expenses Amount by Category
          </h3>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <XAxis dataKey="category" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center">No data to display.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
