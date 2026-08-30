import React from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";

export default function Main() {
  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <Dashboard />
    </div>
  );
}