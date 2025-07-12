import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import getCookie from "../utils/getCookie";

const Dashboard = () => {
  const { token, loadingToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  const usertypeFromCookie = getCookie("role");

  const categoriesFromUser = useMemo(() => {
    if (!user?.expenses) return [];
    return [...new Set(user.expenses.map((e) => e.category))];
  }, [user]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New expense input states (only for non-supervisor)
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");

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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/expenses`,
        {
          amount: Number(newAmount),
          category: newCategory,
          description: newDescription,
          date: newDate || undefined,
        },
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
      setNewDate("");
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Failed to create expense."
      );
    } finally {
      setCreatingExpense(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto rounded-xl p-6">
        <h2 className="text-3xl font-bold text-textMain mb-6 font-kanit">
          Welcome, {user.username}
        </h2>

        {usertypeFromCookie !== "supervisor" && (
          <form
            onSubmit={handleCreateExpense}
            className="mb-8 border rounded-md p-6 bg-blue-50"
          >
            <h3 className="text-2xl font-semibold mb-4">Add New Expense</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Amount (EGP)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {/* <CategorySelect
                categoriesFromUser={categoriesFromUser}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
              /> */}
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
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter new category"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setNewCategory(e.target.value);
                    }}
                    required
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategory("");
                      setNewCategoryName("");
                    }}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <input
                type="date"
                min={
                  new Date(new Date().setMonth(new Date().getMonth() - 1))
                    .toISOString()
                    .split("T")[0]
                }
                max={new Date().toISOString().split("T")[0]}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />

              <p className="text-s text-gray-500 italic mt-1">
                If left empty, today's date will be used.
              </p>

              <textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition md:col-span-2"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={creatingExpense}
              className="mt-4 w-full bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {creatingExpense ? "Adding..." : "Add Expense"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded-md bg-blue-50">
            <p className="pb-2 text-sm text-gray-600">
              Total Expenses This Month
            </p>
            <p className="text-2xl font-bold text-blue-700">
              EGP {totalMonthlyAmount}
            </p>
          </div>
          <div className="p-4 border rounded-md bg-green-50">
            <p className="pb-2 text-sm text-gray-600">All-Time Total</p>
            <p className="text-2xl font-bold text-green-700">
              EGP{" "}
              {user.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-4">Recent Expenses</h3>
          {filteredExpenses && filteredExpenses.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
              {filteredExpenses.slice(0, 3).map((exp) => (
                <li
                  key={exp._id}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className={`text-base font-semibold text-blue-600 ${
                        /[\u0600-\u06FF]/.test(exp.category) ? "font-Rubik" : ""
                      }`}
                    >
                      {exp.category}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(exp.date).toLocaleDateString()}
                    </span>
                  </div>

                  <p
                    className={`text-gray-700 mb-2 line-clamp-2 ${
                      /[\u0600-\u06FF]/.test(exp.description)
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
  );
};

export default Dashboard;
