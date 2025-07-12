import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">
          &copy; 2025 Expense Tracker. All rights reserved.
        </p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a
            href="mailto:support@expensetracker.com"
            className="hover:text-white transition"
          >
            Contact Us
          </a>
          <a
            href="https://github.com/josamcode"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
