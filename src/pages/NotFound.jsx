import { Link } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const NotFound = () => {
  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-xl text-center">
        <div className="flex justify-center mb-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-blue-600" />
        </div>
        {/* <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1> */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Oops! Page not found.
        </h2>
        <p className="text-gray-500 mb-6">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
