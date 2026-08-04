import React from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";

export default function Main() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <Dashboard />
    </div>
  );
}