import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import getCookie from "../utils/getCookie";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";

function parseDateLocal(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const Dashboard = () => {
  const { token, loadingToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  const usertypeFromCookie = getCookie("role");

  const categoriesFromUser = useMemo(() => {
    if (!user?.expenses) return [];
    return [...new Set(user.expenses.map((e) => e.category))];
  }, [user]);

  const projectsFromUser = useMemo(() => {
    if (!user?.expenses) return [];
    return [...new Set(user.expenses.map((e) => e.project).filter(p => p && p.trim() !== ""))];
  }, [user]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New expense input states (only for non-supervisor)
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newProject, setNewProject] = useState("");

  // Loading state for expense creation
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

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
            headers: { Authorization: `Bearer ${token}` },
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

  // Totals
  const totalMonthlyAmount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (
      user?.expenses
        ?.filter(
          (exp) =>
            new Date(exp.date).getMonth() === currentMonth &&
            new Date(exp.date).getFullYear() === currentYear
        )
        .reduce((sum, exp) => sum + exp.amount, 0) || 0
    );
  }, [user]);

  // Filter recent expenses to show 3 latest
  const filteredExpenses = useMemo(() => {
    if (!user?.expenses) return [];
    return [...user.expenses].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [user]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!newAmount || !newCategory) {
      setCreateError("Amount and category are required.");
      return;
    }
    setCreatingExpense(true);

    const selectedDate = newDate ? parseDateLocal(newDate) : new Date();
    selectedDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (selectedDate > now) {
      setCreateError("Future dates are not allowed. Please select today or a past date.");
      setCreatingExpense(false);
      return;
    }

    try {
      const expenseData = {
        amount: Number(newAmount),
        category: newCategory,
        description: newDescription,
        ...(newProject && { project: newProject }),
        date: newDate || undefined,
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/expenses`,
        expenseData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser((prevUser) => ({
        ...prevUser,
        expenses: [...prevUser.expenses, res.data.result],
      }));
      setCreateSuccess("Expense created successfully.");
      setNewAmount("");
      setNewCategory("");
      setNewDescription("");
      setNewProject("");
      setNewDate("");
      setNewProject("");
      setIsAddingProject(false);
      setNewProjectName("");
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Failed to create expense."
      );
    } finally {
      setCreatingExpense(false);
    }
  };

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="sm:py-6 min-h-[calc(100vh-70px)] flex w-full items-start">
      <div className="w-full max-w-7xl mx-auto rounded-xl p-6">
        <h2 className="text-3xl font-bold text-textMain mb-6 font-kanit hidden sm:block">
          Welcome, {user.username}
        </h2>

        {usertypeFromCookie !== "supervisor" && (
          <form
            onSubmit={handleCreateExpense}
            className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 sm:bg-blue-50"
          >
            {createError && (
              <div className="mb-4 text-red-600 font-semibold">
                {createError}
              </div>
            )}

            <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800">
              Add New Expense
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600 font-medium">
                  Amount (EGP)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  placeholder="e.g. 150"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                />
              </div>

              {/* Category Select */}
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label className="text-sm text-gray-600 font-medium">
                  Category
                </label>

                {!isAddingCategory ? (
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      if (e.target.value === "__add_new__") {
                        setIsAddingCategory(true);
                        setNewCategory("");
                      } else {
                        setNewCategory(e.target.value);
                      }
                    }}
                    required
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  >
                    <option value="">Select Category</option>
                    {categoriesFromUser.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_new__">+ Add New Category</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        setNewCategory(e.target.value);
                      }}
                      required
                      className="flex-grow border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategory("");
                        setNewCategoryName("");
                      }}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-sm text-gray-600 font-medium">
                  Date
                </label>
                <DatePicker
                  selected={newDate ? new Date(newDate) : null}
                  onChange={(date) => {
                    if (date) {
                      const localDate = new Date(date);
                      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
                      setNewDate(localDate.toISOString().split("T")[0]);
                    } else {
                      setNewDate("");
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={oneMonthAgo}
                  // maxDate={today}
                  placeholderText="Pick a date (optional, today if left empty)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  showPopperArrow={false}
                />
              </div>

              {/* Project Select/Input */}
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label className="text-sm text-gray-600 font-medium">
                  Project (optional)
                </label>
                {!isAddingProject ? (
                  <select
                    value={newProject}
                    onChange={(e) => {
                      if (e.target.value === "__add_new_project__") {
                        setIsAddingProject(true);
                        setNewProject(""); // Clear the selection
                      } else {
                        setNewProject(e.target.value); // Select existing project
                      }
                    }}
                    className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  >
                    <option value="">Select Project (optional)</option>
                    {projectsFromUser.map((proj) => (
                      <option key={proj} value={proj}>
                        {proj}
                      </option>
                    ))}
                    <option value="__add_new_project__">+ Add New Project</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new project"
                      value={newProjectName}
                      onChange={(e) => {
                        setNewProjectName(e.target.value);
                        setNewProject(e.target.value);
                      }}
                      className="flex-grow border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProject(false);
                        setNewProject("");
                        setNewProjectName("");
                      }}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-sm text-gray-600 font-medium">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  rows={3}
                  placeholder="e.g. Lunch at work, electricity bill..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creatingExpense}
              className="mt-6 w-full bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
            >
              {creatingExpense ? "Adding..." : "Add Expense"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
          <div className="p-3 sm:p-4 border rounded-md bg-blue-50">
            <p className="pb-2 text-sm text-gray-600">
              Total Expenses This Month
            </p>
            <p className="text-2xl font-bold text-blue-700">
              EGP {totalMonthlyAmount}
            </p>
          </div>
          <div className="p-3 sm:p-4 border rounded-md bg-green-50 hidden sm:block">
            <p className="pb-2 text-sm text-gray-600">All-Time Total</p>
            <p className="text-2xl font-bold text-green-700">
              EGP{" "}
              {user.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0}
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Recent Expenses</h3>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              <ul className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
                {filteredExpenses.slice(0, 3).map((exp) => (
                  <li
                    key={exp._id}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm p-3 sm:p-5 min-h-[100px]"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span
                        className={`text-base font-semibold text-blue-600 ${/[\u0600-\u06FF]/.test(exp.category)
                          ? "font-Rubik"
                          : ""
                          }`}
                      >
                        {exp.category}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      className={`text-gray-700 mb-2 line-clamp-2 ${/[\u0600-\u06FF]/.test(exp.description)
                        ? "font-Rubik"
                        : ""
                        }`}
                    >
                      {exp.description || ""}
                    </p>

                    <p className="text-right text-lg font-bold text-green-600">
                      EGP {exp.amount}
                    </p>
                  </li>
                ))}
                <li>
                  <Link
                    to="/profile"
                    className="rounded-xl h-full border border-gray-200 bg-white shadow-sm p-5 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-blue-600 font-semibold gap-2"
                  >
                    Show more <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="text-gray-500">No expenses recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
