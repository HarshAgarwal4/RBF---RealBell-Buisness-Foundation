// Home.jsx

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "../zustand/store";
import { useTheme } from "../context/ThemeProvider";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Handshake,
  Lightbulb,
  Users,
  Target,
  Rocket,
  CheckCircle2,
  ChevronRight,
  Menu,
  Sun,
  Moon,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user]);

  const services = [
    {
      icon: <Briefcase size={32} />,
      title: "Business Consulting",
      desc: "Professional guidance for launching, managing and scaling successful businesses.",
    },
    {
      icon: <Users size={32} />,
      title: "Expert Mentorship",
      desc: "Connect with experienced founders, investors and business mentors.",
    },
    {
      icon: <Rocket size={32} />,
      title: "Startup Acceleration",
      desc: "Transform innovative ideas into investment-ready startups with structured support.",
    },
    {
      icon: <Handshake size={32} />,
      title: "Business Network",
      desc: "Build valuable partnerships with entrepreneurs, mentors and investors.",
    },
  ];

  const stats = [
    { number: "500+", title: "Businesses Supported" },
    { number: "150+", title: "Industry Mentors" },
    { number: "70+", title: "Workshops Conducted" },
    { number: "95%", title: "Success Satisfaction" },
  ];

  const features = [
    "Business Registration Guidance",
    "Funding & Investment Support",
    "Startup Mentorship",
    "Legal & Compliance Assistance",
    "Business Networking",
    "Growth Strategy Planning",
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">

      {/* ================= NAVBAR ================= */}

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <img
              src="/logo.png"
              className="w-12 h-12 rounded-full object-cover"
              alt=""
            />

            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white">
                RealBell Business Foundation
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Empowering Entrepreneurs
              </p>
            </div>

          </div>

          <div className="hidden lg:flex items-center gap-10 text-sm font-medium">

            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400 transition">
              Home
            </a>

            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400 transition">
              About
            </a>

            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400 transition">
              Services
            </a>

            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400 transition">
              Mentors
            </a>

            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400 transition">
              Contact
            </a>

          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6366f1" />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition cursor-pointer"
            >
              Join RBF
            </button>

          </div>

          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
            </button>
            <button className="lg:hidden">
              <Menu />
            </button>
          </div>

        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-linear-to-br from-blue-950 via-slate-900 to-slate-950"></div>

        <div className="absolute w-137.5 h-137.5 rounded-full bg-blue-600/20 blur-3xl -top-40 -left-40"></div>

        <div className="absolute w-112.5 h-112.5 rounded-full bg-cyan-500/20 blur-3xl right-0 bottom-0"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-28">

          <div className="grid lg:grid-cols-2 gap-20 items-center">

            <div>

              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2 rounded-full font-semibold mb-8">
                <Building2 size={18} />
                India's Business Growth Platform
              </div>

              <h1 className="text-6xl font-black leading-tight text-white">

                Empowering

                <span className="block text-blue-400">
                  Entrepreneurs &
                </span>

                <span className="block">
                  Future Businesses
                </span>

              </h1>

              <p className="mt-8 text-lg leading-8 text-slate-300 max-w-xl">

                RealBell Business Foundation provides mentorship,
                startup incubation, networking opportunities,
                business consulting and strategic guidance to
                entrepreneurs aiming to build sustainable and
                successful ventures.

              </p>

              <div className="flex flex-wrap gap-5 mt-12">

                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-8 py-4 rounded-xl text-white font-semibold shadow-lg"
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>

                <button className="border border-white/30 hover:bg-white hover:text-slate-900 transition px-8 py-4 rounded-xl text-white">
                  Learn More
                </button>

              </div>

            </div>

            <div>

              <div className="bg-white rounded-3xl p-10 shadow-2xl">

                <img
                  src="/logo.png"
                  className="w-28 mx-auto"
                  alt=""
                />

                <h2 className="text-3xl font-bold text-center mt-6">
                  RBF
                </h2>

                <p className="text-center text-slate-500 mt-3 leading-7">

                  Supporting startups, founders and business
                  leaders with innovation, mentorship,
                  collaboration and sustainable growth.

                </p>

                <div className="grid grid-cols-2 gap-4 mt-10">

                  <div className="rounded-xl bg-slate-100 p-5 text-center">
                    <Target className="mx-auto text-blue-700" />
                    <p className="mt-3 font-semibold">
                      Mission
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-5 text-center">
                    <Lightbulb className="mx-auto text-blue-700" />
                    <p className="mt-3 font-semibold">
                      Innovation
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= SERVICES ================= */}

      <section className="py-28">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center">

            <span className="text-blue-700 font-semibold uppercase tracking-widest">
              Our Services
            </span>

            <h2 className="text-5xl font-black mt-4">
              What We Provide
            </h2>

            <p className="max-w-3xl mx-auto mt-6 text-slate-500 text-lg leading-8">

              Everything required to build, launch and
              grow a successful startup under one platform.

            </p>

          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mt-20">

            {services.map((item) => (

              <div
                key={item.title}
                className="group bg-white rounded-3xl p-8 border border-slate-200 hover:border-blue-600 hover:-translate-y-2 hover:shadow-2xl transition duration-300"
              >

                <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center">

                  {item.icon}

                </div>

                <h3 className="text-2xl font-bold mt-8">

                  {item.title}

                </h3>

                <p className="text-slate-500 leading-7 mt-4">

                  {item.desc}

                </p>

                <button className="flex items-center gap-2 mt-8 text-blue-700 font-semibold">

                  Learn More

                  <ChevronRight size={18} />

                </button>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ================= ABOUT ================= */}

      <section className="py-28 bg-white">

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-20 items-center">

            <div>

              <span className="font-semibold text-blue-700 uppercase">
                Why Choose RBF
              </span>

              <h2 className="text-5xl font-black mt-5">

                Helping Businesses
                Build Strong Foundations

              </h2>

              <p className="mt-8 text-lg text-slate-600 leading-8">

                Our mission is to empower entrepreneurs by
                providing mentorship, professional guidance,
                business development resources and valuable
                industry connections.

              </p>

              <div className="mt-10 space-y-5">

                {features.map((item) => (

                  <div
                    key={item}
                    className="flex items-center gap-4"
                  >

                    <CheckCircle2
                      className="text-blue-700"
                      size={24}
                    />

                    <span className="text-lg">

                      {item}

                    </span>

                  </div>

                ))}

              </div>

            </div>

            <div className="grid grid-cols-2 gap-6">

              {stats.map((item) => (

                <div
                  key={item.title}
                  className="bg-slate-50 rounded-3xl p-10 border border-slate-200 text-center hover:shadow-xl transition"
                >

                  <h2 className="text-5xl font-black text-blue-700">

                    {item.number}

                  </h2>

                  <p className="mt-4 text-slate-600">

                    {item.title}

                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="py-28">

        <div className="max-w-6xl mx-auto px-6">

          <div className="rounded-[40px] overflow-hidden bg-linear-to-r from-blue-800 via-blue-700 to-cyan-700 p-20 text-center text-white shadow-2xl">

            <h2 className="text-5xl font-black">

              Start Building Your Business Today

            </h2>

            <p className="text-xl text-blue-100 mt-8 max-w-3xl mx-auto leading-8">

              Become a member of RealBell Business Foundation
              and gain access to business mentors,
              networking opportunities, startup support,
              strategic consulting and professional growth.

            </p>

            <button
              onClick={() => navigate("/signup")}
              className="mt-12 bg-white text-blue-700 hover:bg-slate-100 transition px-10 py-4 rounded-xl text-lg font-bold shadow-xl"
            >

              Join RBF

            </button>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="bg-slate-950 text-slate-400">

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="grid lg:grid-cols-4 gap-12">

            <div>

              <img
                src="/logo.png"
                className="w-16"
                alt=""
              />

              <h2 className="text-white text-2xl font-bold mt-5">

                RealBell Business Foundation

              </h2>

              <p className="mt-5 leading-7">

                Building entrepreneurs through mentorship,
                innovation and strategic business guidance.

              </p>

            </div>

            <div>

              <h3 className="text-white font-bold text-lg mb-6">

                Company

              </h3>

              <div className="space-y-4">

                <p>About Us</p>
                <p>Services</p>
                <p>Mentors</p>
                <p>Events</p>

              </div>

            </div>

            <div>

              <h3 className="text-white font-bold text-lg mb-6">

                Resources

              </h3>

              <div className="space-y-4">

                <p>Startup Guide</p>
                <p>Business Support</p>
                <p>Investor Network</p>
                <p>Help Center</p>

              </div>

            </div>

            <div>

              <h3 className="text-white font-bold text-lg mb-6">

                Contact

              </h3>

              <div className="space-y-4">

                <p>Jaipur, Rajasthan</p>
                <p>support@realbellfoundation.org</p>
                <p>+91 XXXXX XXXXX</p>

              </div>

            </div>

          </div>

          <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col lg:flex-row justify-between items-center">

            <p>

              © 2026 RealBell Business Foundation. All Rights Reserved.

            </p>

            <div className="flex gap-8 mt-5 lg:mt-0">

              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
              <a href="#">Support</a>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};

export default Home;