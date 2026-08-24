import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Home, ArrowLeft, TriangleAlert } from "lucide-react";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <Sidebar />

      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 flex min-h-screen items-center justify-center bg-[#f8f8f8] dark:bg-[#0B0F19] px-6 py-10 transition-colors">

        <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white dark:bg-[#151D2E] border border-transparent dark:border-slate-800 shadow-2xl">

          {/* Decorative Circle */}
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#9d1d27]/10 dark:bg-[#9d1d27]/20"></div>
          <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-[#9d1d27]/5 dark:bg-[#9d1d27]/10"></div>

          {/* Watermark */}
          <h1 className="absolute left-1/2 top-8 -translate-x-1/2 text-[180px] font-black text-[#9d1d27]/5 dark:text-[#9d1d27]/10 select-none">
            404
          </h1>

          <div className="relative z-10 px-10 py-16 text-center">

            {/* Icon */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#9d1d27]/10 dark:bg-[#9d1d27]/20">
              <TriangleAlert size={42} className="text-[#9d1d27] dark:text-[#F43F5E]" />
            </div>

            <h2 className="mt-8 text-4xl font-bold text-gray-900 dark:text-slate-100">
              Page Not Found
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-gray-500 dark:text-slate-400">
              Sorry, the page you are looking for doesn't exist or has been
              moved. Please check the URL or return to the dashboard.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">

              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#9d1d27] px-8 py-3 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#821721] cursor-pointer"
              >
                <Home size={18} />
                Back to Home
              </button>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#9d1d27] dark:border-rose-500/40 px-8 py-3 font-semibold text-[#9d1d27] dark:text-rose-400 transition duration-300 hover:-translate-y-1 hover:bg-[#9d1d27] hover:text-white cursor-pointer"
              >
                <ArrowLeft size={18} />
                Previous Page
              </button>

            </div>

            <div className="mt-12 border-t border-gray-200 dark:border-slate-800 pt-6">
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Error Code <span className="font-semibold text-[#9d1d27] dark:text-rose-400">404</span> •
                RealBell Business Foundation
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default PageNotFound;

