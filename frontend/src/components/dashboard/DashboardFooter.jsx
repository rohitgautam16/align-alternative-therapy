import { Link } from "react-router-dom"; 

export default function DashboardFooter() {
  return (
    <footer className="w-full px-8 py-4 bg-black text-gray-400">
      <div className="mx-auto px-6 py-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
          <Link
            to=""
            className="hover:text-white transition"
          >
            Privacy Policy
          </Link>

          <Link
            to=""
            className="hover:text-white transition"
          >
            Terms & Conditions
          </Link>

          {/* <Link
            to="/dashboard/faqs"
            className="hover:text-white transition"
          >
            FAQs
          </Link> */}
        </div>

        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Align Alternative Therapy
        </p>
      </div>
    </footer>
  );
}
