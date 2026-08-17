import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { COLORS } from "../../../components/colors";
import {
  Scale,
  ShieldCheck,
  FileText,
  Building2,
  Award,
  Rocket,
  Search,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileArchive,
  Layers,
  HelpCircle,
  Sparkles,
  ChevronRight,
  FolderLock,
  Briefcase,
} from "lucide-react";

const ICON_COMPONENTS = {
  Scale,
  ShieldCheck,
  FileText,
  Building2,
  Award,
  Rocket,
  Briefcase,
  FileArchive,
};

export default function LegalServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await axios.get("/legal-compliance/services/active");
        if (res.data?.status === 1) {
          setServices(res.data.services || []);
        }
      } catch (err) {
        console.error("Failed to fetch legal compliance services:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#E2E8F0] font-sans">
      <Sidebar />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <main className="flex-1 lg:pl-[300px] pt-16 lg:pt-0 min-h-screen flex flex-col">
        {/* Top Banner Header */}
        <div className="bg-white dark:bg-[#111827] border-b border-[#E2E8F0] dark:border-[#1F2937] px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B52B2B] mb-2">
                  <Scale size={16} /> Legal & Regulatory Compliances
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  Legal Compliance Services
                </h1>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl">
                  Fast-track your startup & enterprise legal registrations, trademarks, GST, incorporations, and government recognitions seamlessly.
                </p>
              </div>

              {/* Quick Navigation Action Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate("/legal-compliances/my-applications")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-semibold text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition shadow-xs cursor-pointer"
                >
                  <Layers size={16} className="text-[#B52B2B]" /> My Applications
                </button>
                <button
                  onClick={() => navigate("/legal-compliances/documents")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-semibold text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition shadow-xs cursor-pointer"
                >
                  <FolderLock size={16} className="text-[#B52B2B]" /> Legal Documents
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search legal services (e.g. Trademark, GST, Private Ltd)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1F2937] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#B52B2B]/20 focus:border-[#B52B2B] transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? "bg-[#B52B2B] text-white shadow-xs"
                          : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#B52B2B]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid Content */}
        <div className="flex-1 px-6 lg:px-10 py-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-72 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] animate-pulse p-6"
                />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-8">
              <Scale size={48} className="mx-auto text-[#94A3B8] mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                No Compliance Services Found
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                Try searching for something else or switch the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const IconComponent = ICON_COMPONENTS[service.icon] || Scale;
                const isFree = !service.is_payment_required || service.fee === 0;

                return (
                  <div
                    key={service._id}
                    className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] p-6 hover:shadow-md hover:border-[#B52B2B]/40 transition duration-200 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-11 w-11 rounded-xl bg-[#F6E9EB] dark:bg-[#B52B2B]/10 flex items-center justify-center text-[#B52B2B] group-hover:scale-105 transition">
                          <IconComponent size={22} />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8]">
                          {service.category || "Legal Service"}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-[#0F172A] dark:text-white group-hover:text-[#B52B2B] transition line-clamp-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
                        {service.short_description || service.description}
                      </p>

                      {/* Service Highlights */}
                      <div className="mt-4 pt-4 border-t border-[#F1F5F9] dark:border-[#1F2937] space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#94A3B8]" /> Processing Time:
                          </span>
                          <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                            {service.processing_time || "3-5 Days"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
                          <span className="flex items-center gap-1.5">
                            <FileArchive size={13} className="text-[#94A3B8]" /> Required Docs:
                          </span>
                          <span className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                            {service.required_documents?.length || 0} Files
                          </span>
                        </div>
                      </div>

                      {/* Required Documents Mini Pill Preview */}
                      {service.required_documents?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {service.required_documents.slice(0, 3).map((d) => (
                            <span
                              key={d.id}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] truncate max-w-[120px]"
                              title={d.name}
                            >
                              ✓ {d.name}
                            </span>
                          ))}
                          {service.required_documents.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]">
                              +{service.required_documents.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: Pricing & Action Button */}
                    <div className="mt-6 pt-4 border-t border-[#F1F5F9] dark:border-[#1F2937] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
                          Service Fee
                        </div>
                        <div className="text-base font-extrabold text-[#0F172A] dark:text-white">
                          {isFree ? (
                            <span className="text-[#16A34A] font-bold">FREE</span>
                          ) : (
                            `₹${Number(service.fee).toLocaleString("en-IN")}`
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/legal-compliances/services/${service._id}/apply`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B52B2B] hover:bg-[#9B1B2A] text-white text-xs font-bold transition shadow-xs cursor-pointer group-hover:translate-x-0.5"
                      >
                        Avail Service <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
