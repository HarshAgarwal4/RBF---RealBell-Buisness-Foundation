import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import * as THREE from "three";
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
  X,
  Sun,
  Moon,
  TrendingUp,
  Award,
  ShieldCheck,
  Globe,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  FileText,
  Video,
  Check,
  ChevronDown,
  Mail,
  Send,
  Star,
  ExternalLink,
  Layers,
  BarChart3,
  Shield,
  Compass,
  Play
} from "lucide-react";

/* =========================================================================
   1. FULL-PAGE 3D RAINING GOLD COINS & CAPITAL TOKENS CANVAS (THREE.JS)
   ========================================================================= */
function Hero3DCanvas({ isDark = true, isFocusMode = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let isMobile = width < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 52 : 45, width / height, 0.1, 1000);
    camera.position.set(0, 0, isMobile ? 32 : 26);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.25 : 1.05;
    container.appendChild(renderer.domElement);

    // --- 1. LIGHTING SETUP FOR METALLIC GOLD SHINE ---
    const ambientLight = new THREE.AmbientLight(isDark ? 0xfff5ea : 0xffffff, isDark ? 1.3 : 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffd700, isDark ? 2.4 : 1.9);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, isDark ? 1.5 : 1.0);
    dirLight2.position.set(-15, -10, 10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffbe28, isDark ? 2.6 : 2.0, 50);
    pointLight.position.set(0, 5, 12);
    scene.add(pointLight);

    // --- 2. GENERATE HIGH-RES COIN TEXTURE WITH ₹ EMBOSSED EMBLEM ---
    const createCoinTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // Radial Gold Gradient
      const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
      grad.addColorStop(0, "#fffbeb");
      grad.addColorStop(0.25, "#fde047");
      grad.addColorStop(0.65, "#eab308");
      grad.addColorStop(0.9, "#ca8a04");
      grad.addColorStop(1, "#854d0e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();

      // Outer Gold Rim Ring
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(256, 256, 235, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Beveled Border
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 256, 215, 0, Math.PI * 2);
      ctx.stroke();

      // Dotted Security Rim
      ctx.strokeStyle = "#713f12";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(256, 256, 198, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Embossed "REALBELL" Arced Text (Top)
      ctx.fillStyle = "#78350f";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("• REALBELL BUSINESS FOUNDATION •", 256, 80);

      // Central Rupee Symbol (₹) with 3D drop shadow
      ctx.shadowColor = "rgba(113, 63, 18, 0.6)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = "#713f12";
      ctx.font = "900 170px 'Inter', sans-serif";
      ctx.fillText("₹", 256, 275);

      // Specular highlight on Rupee
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#fef9c3";
      ctx.font = "900 170px 'Inter', sans-serif";
      ctx.fillText("₹", 252, 270);

      return new THREE.CanvasTexture(canvas);
    };

    const coinTexture = createCoinTexture();

    // --- 3. MATERIALS FOR 3D COIN MESH ---
    const coinGeometry = new THREE.CylinderGeometry(1.25, 1.25, 0.18, isMobile ? 32 : 48);

    const faceMaterial = new THREE.MeshStandardMaterial({
      map: coinTexture,
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.5,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.95,
      roughness: 0.18,
    });

    const coinMaterials = [rimMaterial, faceMaterial, faceMaterial];

    // --- 4. CREATE 3D RAINING COINS CLUSTER (ACROSS FULL VIEWPORT) ---
    const coinCount = isMobile ? 24 : 46;
    const coins = [];
    const spreadX = isMobile ? 22 : 44;

    for (let i = 0; i < coinCount; i++) {
      const coinMesh = new THREE.Mesh(coinGeometry, coinMaterials);

      // Stagger position across full viewport width and height
      const startX = (Math.random() - 0.5) * spreadX;
      const startY = (Math.random() - 0.5) * 36;
      const startZ = (Math.random() - 0.5) * 18 - 2;

      coinMesh.position.set(startX, startY, startZ);

      // Responsive scale variation
      const baseScale = isMobile ? 0.5 : 0.65;
      const scaleRange = isMobile ? 0.45 : 0.7;
      const scale = baseScale + Math.random() * scaleRange;
      coinMesh.scale.set(scale, scale, scale);

      // Random initial rotations
      coinMesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      scene.add(coinMesh);

      coins.push({
        mesh: coinMesh,
        speedY: 0.04 + Math.random() * (isMobile ? 0.05 : 0.065),
        speedX: (Math.random() - 0.5) * 0.015,
        rotX: (Math.random() - 0.5) * 0.045,
        rotY: (Math.random() - 0.5) * 0.055,
        rotZ: (Math.random() - 0.5) * 0.04,
        scale,
      });
    }

    // --- 5. FLOATING GOLDEN SPARKLES & PARTICLES ---
    const sparkleCount = isMobile ? 80 : 160;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePos = new Float32Array(sparkleCount * 3);
    const sparkleColors = new Float32Array(sparkleCount * 3);

    const goldSpark = new THREE.Color(0xfde047);
    const amberSpark = new THREE.Color(0xf59e0b);
    const indigoSpark = new THREE.Color(isDark ? 0x818cf8 : 0x6366f1);

    for (let i = 0; i < sparkleCount; i++) {
      sparklePos[i * 3] = (Math.random() - 0.5) * (isMobile ? 26 : 48);
      sparklePos[i * 3 + 1] = (Math.random() - 0.5) * 38;
      sparklePos[i * 3 + 2] = (Math.random() - 0.5) * 22;

      const col = i % 3 === 0 ? goldSpark : i % 3 === 1 ? amberSpark : indigoSpark;
      sparkleColors[i * 3] = col.r;
      sparkleColors[i * 3 + 1] = col.g;
      sparkleColors[i * 3 + 2] = col.b;
    }

    sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparklePos, 3));
    sparkleGeo.setAttribute("color", new THREE.BufferAttribute(sparkleColors, 3));

    const sparkleMat = new THREE.PointsMaterial({
      size: isMobile ? 0.16 : 0.22,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.8 : 0.6,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
    scene.add(sparkles);

    // Mouse & Touch Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    const onMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onTouchMove = (event) => {
      if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX / window.innerWidth - 0.5) * 2;
        mouseY = (event.touches[0].clientY / window.innerHeight - 0.5) * 2;
      }
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchMove, { passive: true });

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.003;
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      if (!container) return;
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768;

      camera.aspect = width / height;
      camera.fov = isMobile ? 52 : 45;
      camera.position.z = isMobile ? 32 : 26;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    };
    window.addEventListener("resize", onResize);

    // Animation Loop
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      scrollVelocity *= 0.92;

      // Subtle Camera Tilt
      camera.position.x = targetX * (isMobile ? 1.2 : 2.2);
      camera.position.y = -targetY * (isMobile ? 0.8 : 1.5);
      camera.lookAt(0, 0, 0);

      // Animate Point Light
      pointLight.position.x = targetX * 14;
      pointLight.position.y = -targetY * 9 + 4;

      // Animate Each Raining 3D Coin Across Full Page
      const mouse3DX = targetX * (isMobile ? 10 : 16);
      const mouse3DY = -targetY * (isMobile ? 7 : 12);
      const currentSpreadX = isMobile ? 22 : 44;

      for (let i = 0; i < coins.length; i++) {
        const item = coins[i];
        const mesh = item.mesh;

        // Fall Downwards + scroll acceleration
        mesh.position.y -= item.speedY + Math.abs(scrollVelocity);
        mesh.position.x += item.speedX;

        // Rotate & Tumble in 3D
        mesh.rotation.x += item.rotX + scrollVelocity * 0.1;
        mesh.rotation.y += item.rotY;
        mesh.rotation.z += item.rotZ;

        // Pointer Physics Interaction (gentle repulsion)
        const dx = mesh.position.x - mouse3DX;
        const dy = mesh.position.y - mouse3DY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (isMobile ? 4.5 : 6.0)) {
          const pushForce = ((isMobile ? 4.5 : 6.0) - dist) * 0.015;
          mesh.position.x += (dx / dist) * pushForce;
          mesh.position.y += (dy / dist) * pushForce;
          mesh.rotation.x += 0.06;
          mesh.rotation.y += 0.06;
        }

        // Loop Back to Top When Falling Off Screen
        if (mesh.position.y < -19) {
          mesh.position.y = 19 + Math.random() * 4;
          mesh.position.x = (Math.random() - 0.5) * currentSpreadX;
          mesh.position.z = (Math.random() - 0.5) * 18 - 2;
          item.speedY = 0.04 + Math.random() * (isMobile ? 0.05 : 0.065);
        }
      }

      // Sparkles Fall & Swirl
      const sPos = sparkleGeo.attributes.position;
      for (let i = 0; i < sparkleCount; i++) {
        sPos.array[i * 3 + 1] -= 0.025 + Math.abs(scrollVelocity) * 0.5;
        if (sPos.array[i * 3 + 1] < -20) {
          sPos.array[i * 3 + 1] = 20;
          sPos.array[i * 3] = (Math.random() - 0.5) * (isMobile ? 26 : 48);
        }
      }
      sPos.needsUpdate = true;
      sparkles.rotation.y += 0.001;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coinGeometry.dispose();
      coinTexture.dispose();
      faceMaterial.dispose();
      rimMaterial.dispose();
      sparkleGeo.dispose();
      sparkleMat.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-500 ${
        isFocusMode ? "opacity-100" : isDark ? "opacity-95" : "opacity-85"
      }`}
    />
  );
}

/* =========================================================================
   2. INTERACTIVE 3D TILT SPOTLIGHT CARD COMPONENT
   ========================================================================= */
function TiltCard({ children, className = "", glowColor = "rgba(245, 158, 11, 0.18)" }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setCoords({ x, y });
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative rounded-2xl transition-shadow duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 70%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

/* =========================================================================
   3. ANIMATION VARIANTS
   ========================================================================= */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/* =========================================================================
   4. MAIN HOME COMPONENT
   ========================================================================= */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePersona, setActivePersona] = useState("startups");
  const [openFaq, setOpenFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [is3DViewMode, setIs3DViewMode] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "services", "personas", "how-it-works", "demo-days", "faq"];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { number: "500+", title: "Ventures Incubated", subtitle: "Across 20+ Sectors", icon: Rocket },
    { number: "₹45 Cr+", title: "Funding Catalyzed", subtitle: "Pre-seed & Seed", icon: TrendingUp },
    { number: "150+", title: "Industry Mentors", subtitle: "Founders & CXOs", icon: Users },
    { number: "40+", title: "Demo Days", subtitle: "Pan-India Tracks", icon: Award },
  ];

  const personas = {
    startups: {
      id: "startups",
      title: "For Startups & Founders",
      icon: Rocket,
      tagline: "Turn groundbreaking concepts into scalable, investment-ready enterprises with institutional backing.",
      points: [
        "Structured cohort incubation with milestone accountability & weekly sprints",
        "Direct access to angel syndicates, micro-VCs & government grant programs",
        "1-on-1 strategic advisory with seasoned founders & industry veterans",
        "Standardized legal vault: term sheets, founder vesting & compliance tools",
      ],
      badge: "Founder Track",
      cta: "Join as a Startup",
      route: "/signup",
    },
    investors: {
      id: "investors",
      title: "For Angels & VC Investors",
      icon: TrendingUp,
      tagline: "Discover pre-vetted, high-conviction startups and co-invest with verified cap-table transparency.",
      points: [
        "Curated deal flow filtered by metrics, traction & audited revenue",
        "Standardized due-diligence data rooms and compliance verification",
        "Syndicate formation and co-investment management infrastructure",
        "Quarterly private demo days and direct founder pitch sessions",
      ],
      badge: "Investor Track",
      cta: "Join as an Investor",
      route: "/signup",
    },
    mentors: {
      id: "mentors",
      title: "For Mentors & Advisors",
      icon: Users,
      tagline: "Guide the next wave of founders, share operational playbooks, and create lasting economic impact.",
      points: [
        "Matched with high-intent founders in your specific domain of expertise",
        "Facilitate masterclasses, workshops, and exclusive 1-on-1 office hour clinics",
        "Standardized advisory equity framework and verified mentor credentials",
        "Network with senior leaders, policymakers, and corporate catalysts",
      ],
      badge: "Mentor Track",
      cta: "Join as a Mentor",
      route: "/signup",
    },
    incubators: {
      id: "incubators",
      title: "For Incubators & Partners",
      icon: Building2,
      tagline: "Supercharge your cohort management, application evaluation, and cross-ecosystem syndication.",
      points: [
        "End-to-end cohort application and multi-reviewer scoring workflows",
        "Centralized founder milestone tracking and real-time KPI dashboards",
        "Cross-ecosystem syndicate syndication and corporate innovation partnerships",
        "Integrated resource vault, legal frameworks, and knowledge exchange system",
      ],
      badge: "Partner Track",
      cta: "Join as an Incubator",
      route: "/signup",
    },
  };

  const services = [
    {
      icon: Rocket,
      title: "Cohort Incubation & Acceleration",
      desc: "Immersive 12-week acceleration programs tailored for seed-stage startups, covering product-market fit, unit economics, and go-to-market execution.",
      tag: "Foundations",
    },
    {
      icon: Handshake,
      title: "Capital Connect & Syndicates",
      desc: "Structured introductions to angel networks, family offices, and institutional venture capital funds aligned with your business model.",
      tag: "Fundraising",
    },
    {
      icon: Users,
      title: "1-on-1 Strategic Mentorship",
      desc: "Continuous guidance from vetted operators who have successfully built, scaled, and exited ventures in Indian and global markets.",
      tag: "Advisory",
    },
    {
      icon: ShieldCheck,
      title: "Legal, IP & Regulatory Guidance",
      desc: "Pro-bono and partner legal advisories covering entity structuring, founder vesting, trademark filing, and tax incentive registrations.",
      tag: "Compliance",
    },
    {
      icon: BookOpen,
      title: "Verified Resource Vault",
      desc: "Instant access to standardized investor-grade pitch deck templates, term sheet benchmarks, cap table models, and market intelligence reports.",
      tag: "Intelligence",
    },
    {
      icon: Target,
      title: "Milestone & KPI Accountability",
      desc: "Track critical product, revenue, and hiring milestones with our built-in progress tracker and monthly investor update tools.",
      tag: "Execution",
    },
  ];

  const roadmap = [
    {
      step: "01",
      title: "Onboard & Define Profile",
      desc: "Create your foundation profile as a Startup, Investor, Mentor, or Incubator. Complete stakeholder verification.",
      icon: Users,
    },
    {
      step: "02",
      title: "Smart Ecosystem Matching",
      desc: "Get paired with domain mentors, relevant cohorts, and potential investors based on industry and stage.",
      icon: Compass,
    },
    {
      step: "03",
      title: "Execute & Accelerate",
      desc: "Engage in cohort sprints, access the legal vault, schedule advisory office hours, and track milestones.",
      icon: Zap,
    },
    {
      step: "04",
      title: "Pitch, Fund & Scale",
      desc: "Participate in RBF Demo Days, secure capital, expand your team, and become a mentor for the next generation.",
      icon: Award,
    },
  ];

  const upcomingPrograms = [
    {
      title: "RBF Seed Sprint Cohort 2026",
      category: "Incubation",
      date: "Applications Open • March 2026",
      desc: "A hands-on 10-week sprint for early-stage founders to establish PMF, build distribution, and prepare for initial angel rounds.",
      badge: "Flagship",
      color: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "All-India Angel Pitch Marathon",
      category: "Fundraising",
      date: "Bi-monthly • April 15, 2026",
      desc: "Exclusive live pitch arena presenting 12 shortlisted startups to a syndicate of 50+ accredited angel investors and micro-VCs.",
      badge: "Investor Arena",
      color: "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    },
    {
      title: "Masterclass: Compliance & Cap Tables",
      category: "Workshop",
      date: "Live Webinar • Alternate Friday",
      desc: "Expert breakdown of ESOP pools, convertible notes, Section 80-IAC tax exemptions, and founder vesting agreements.",
      badge: "Free for Members",
      color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  const testimonials = [
    {
      quote:
        "RealBell Business Foundation provided us with the exact regulatory clarity, mentor guidance, and investor introductions we needed to close our ₹1.8 Cr seed round within 8 weeks.",
      author: "Aditya Verma",
      role: "Co-founder & CEO",
      company: "NexusHealth Technologies",
      stage: "Raised Seed • Incubated in RBF",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    {
      quote:
        "As an angel investor, the quality of vetted startups, transparent milestone metrics, and clean diligence data rooms on RBF makes deal discovery 10x faster.",
      author: "Pooja Singhania",
      role: "Managing Partner",
      company: "Apex Angel Syndicate",
      stage: "Active Backer • 12 Portfolio Startups",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
    },
    {
      quote:
        "Mentoring high-conviction founders through RBF has been immensely rewarding. The platform's milestone tracking structure ensures actionable outcomes after every advisory session.",
      author: "Dr. Arvind Rao",
      role: "Ex-VP Engineering & Mentor",
      company: "Venture Advisor",
      stage: "15+ Startups Guided",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
  ];

  const faqs = [
    {
      q: "What is RealBell Business Foundation (RBF)?",
      a: "RealBell Business Foundation is a non-profit and ecosystem initiative dedicated to empowering startups, entrepreneurs, and business leaders in India. We provide incubation support, structured mentorship, angel investment connect, legal resources, and milestone accountability under a single integrated platform.",
    },
    {
      q: "Who can join the RBF platform?",
      a: "RBF is designed for four core stakeholders: (1) Startups & early-stage founders seeking growth and capital, (2) Angel investors, VC funds, and syndicates looking for vetted deal flow, (3) Experienced mentors & CXOs wishing to advise founders, and (4) Regional incubators & accelerators looking to collaborate.",
    },
    {
      q: "Is there any cost to join and register on RBF?",
      a: "Basic registration, profile creation, and access to community networking and foundational resource guides are completely free during our Open Beta preview. Specific premium cohort programs or specialized services may have subsidized fees.",
    },
    {
      q: "How does the mentor matching process work?",
      a: "Once your startup profile and industry domain are submitted, our intelligent matching system and program managers recommend mentors with specific operational background in your sector. You can schedule 1-on-1 advisory sessions and track action items.",
    },
    {
      q: "How can investors access deal flow on RBF?",
      a: "Accredited individual angels, syndicates, and institutional funds can register under the Investor track. Upon profile verification, investors gain access to verified startup profiles, pitch decks, milestone updates, and private demo day invitations.",
    },
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && /^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 overflow-x-hidden font-['Inter',sans-serif] transition-colors duration-300">
      
      {/* FULL-PAGE FIXED 3D RAINING GOLD COINS CANVAS LAYER */}
      <Hero3DCanvas isDark={isDark} isFocusMode={is3DViewMode} />

      {/* Top Global Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-400 z-50 origin-left shadow-lg shadow-amber-500/50"
        style={{ scaleX }}
      />

      {/* Floating Vertical Section Indicator / Slide Dock */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl p-2.5 rounded-full border border-slate-200 dark:border-slate-800/80 shadow-2xl shadow-slate-300/50 dark:shadow-black/60">
        {[
          { id: "hero", label: "Overview" },
          { id: "services", label: "Capabilities" },
          { id: "personas", label: "Tracks" },
          { id: "how-it-works", label: "Roadmap" },
          { id: "demo-days", label: "Cohorts" },
          { id: "faq", label: "FAQ" },
        ].map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            title={s.label}
            className="group relative flex items-center justify-center p-1.5"
          >
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                activeSection === s.id
                  ? "bg-amber-500 dark:bg-amber-400 scale-150 shadow-md shadow-amber-400/80 ring-2 ring-amber-400/30"
                  : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500"
              }`}
            />
            <span className="absolute right-7 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              {s.label}
            </span>
          </a>
        ))}

        {/* 3D Focus View Toggle Button */}
        <button
          onClick={() => setIs3DViewMode(!is3DViewMode)}
          title={is3DViewMode ? "Restore Full Content" : "Preview 3D Coin Rain (Pure View)"}
          className={`p-2 rounded-full transition-all cursor-pointer shadow-md ${
            is3DViewMode
              ? "bg-amber-500 text-white ring-2 ring-amber-400 shadow-amber-500/50"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500"
          }`}
        >
          <Sparkles size={14} className={is3DViewMode ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Floating 3D Focus Banner when active */}
      <AnimatePresence>
        {is3DViewMode && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-slate-950/90 text-white border border-amber-500/50 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-bold"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>3D Full-Page Preview Mode Active</span>
            <button
              onClick={() => setIs3DViewMode(false)}
              className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] cursor-pointer transition-colors"
            >
              Exit 3D View
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= STICKY NAVBAR ================= */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-500 opacity-30 dark:opacity-40 blur-sm group-hover:opacity-70 transition duration-300" />
              <img
                src="/logo.png"
                alt="RealBell Foundation Logo"
                className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 sm:p-1.5 border border-slate-200 dark:border-slate-800 shadow-md"
              />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                REAL<span className="text-amber-600 dark:text-amber-500">BELL</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md">
                  Foundation
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none sm:leading-normal">
                Empowering India's Entrepreneurs
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#services" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Capabilities
            </a>
            <a href="#personas" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Tracks
            </a>
            <a href="#how-it-works" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Roadmap
            </a>
            <a href="#demo-days" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Cohorts
            </a>
            <a href="#faq" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3.5">
            {/* 3D Focus Toggle */}
            <button
              onClick={() => setIs3DViewMode(!is3DViewMode)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                is3DViewMode
                  ? "bg-amber-500 border-amber-400 text-white"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={is3DViewMode ? "Exit 3D View" : "Full 3D Coins View"}
            >
              <Sparkles size={18} className={is3DViewMode ? "text-white" : "text-amber-500"} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">Join Ecosystem</span>
              <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIs3DViewMode(!is3DViewMode)}
              className={`p-2 rounded-lg border cursor-pointer ${
                is3DViewMode
                  ? "bg-amber-500 border-amber-400 text-white"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-amber-500"
              }`}
              title="Toggle 3D View"
            >
              <Sparkles size={17} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-5 shadow-2xl"
            >
              <div className="flex flex-col gap-3 font-semibold text-slate-700 dark:text-slate-200 text-sm">
                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-900 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  Capabilities
                </a>
                <a
                  href="#personas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-900 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  Tracks
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-900 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  Roadmap
                </a>
                <a
                  href="#demo-days"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-900 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  Cohorts &amp; Events
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-900 hover:text-amber-600 dark:hover:text-amber-400"
                >
                  FAQ
                </a>

                <div className="pt-3 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-center font-bold text-slate-800 dark:text-white cursor-pointer text-sm"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signup");
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-center font-bold text-white shadow-lg shadow-amber-600/30 cursor-pointer text-sm"
                  >
                    Join Ecosystem
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================= SECTION 1: HERO ================= */}
      <section id="hero" className={`relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center pt-6 pb-16 sm:pt-8 sm:pb-20 overflow-hidden transition-opacity duration-300 ${is3DViewMode ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] h-[250px] sm:h-[450px] bg-gradient-to-tr from-amber-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            
            {/* Hero Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 text-center lg:text-left"
            >
              {/* Live Status Beacon Badge */}
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-4 sm:mb-6 shadow-xs max-w-full">
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-amber-600 dark:bg-amber-500" />
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 truncate">
                  India's Premier Business Incubation Ecosystem
                </span>
              </motion.div>

              {/* Main Headline (Fully Responsive for Mobile) */}
              <motion.h1
                variants={fadeInUp}
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18] sm:leading-[1.12] mb-4 sm:mb-6"
              >
                Where High-Growth <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 dark:from-amber-400 dark:via-amber-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  Founders &amp; Capital Converge
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeInUp}
                className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8"
              >
                RealBell Business Foundation bridges early-stage startups with institutional angel syndicates, veteran CXO mentors, cohort acceleration programs, and verified legal frameworks.
              </motion.p>

              {/* Primary CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-12"
              >
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto relative group overflow-hidden px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-sm sm:text-base font-bold text-white shadow-xl shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">Apply For Incubation</span>
                  <Rocket size={17} className="relative z-10 group-hover:rotate-12 transition-transform" />
                </button>

                <a
                  href="#personas"
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore Tracks</span>
                  <ArrowRight size={16} />
                </a>
              </motion.div>

              {/* Trust Badges (Stacked on small screens) */}
              <motion.div
                variants={fadeInUp}
                className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-900/80 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>DPIIT &amp; Section 8 Recognized</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Vetted Angel Syndicates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Zero Equity Fee for Preview</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Right Visual: Interactive Glass Terminal & Live Metrics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <TiltCard className="bg-white/90 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-slate-800/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] sm:text-xs font-mono text-slate-400 dark:text-slate-500 ml-1 sm:ml-2">rbf-ecosystem-live.io</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>

                {/* Simulated Live Ecosystem Feed */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Item 1 */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <TrendingUp size={13} className="text-emerald-500 dark:text-emerald-400" />
                        Seed Capital Closed
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">2h ago</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      NexusHealth closed <strong className="text-amber-600 dark:text-amber-400">₹1.8 Cr</strong> angel round with Apex Syndicate.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <Rocket size={13} className="text-indigo-500 dark:text-indigo-400" />
                        New Cohort Intake
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">Active</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      Sprint 2026 Batch: 24 Startups shortlisted for demo day presentations.
                    </p>
                  </div>

                  {/* Item 3: Milestone Progress Bar */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5 sm:mb-2">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Target size={13} className="text-amber-500 dark:text-amber-400" />
                        Milestone Velocity
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">92% On-Track</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Terminal Action Button */}
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>View Deal Room Preview</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: STATS METRICS GRID ================= */}
      <section className="py-8 sm:py-12 bg-white/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {stats.map((stat) => {
              const IconComp = stat.icon;
              return (
                <TiltCard
                  key={stat.title}
                  glowColor="rgba(99, 102, 241, 0.15)"
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-center shadow-xs"
                >
                  <div className="inline-flex p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 sm:mb-3 border border-amber-500/20">
                    <IconComp size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-0.5">
                    {stat.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {stat.subtitle}
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: CORE CAPABILITIES & SERVICES ================= */}
      <section id="services" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Full-Stack Acceleration
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              Everything Your Venture Needs to Scale
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              A complete institutional suite designed to eliminate roadblocks in fundraising, mentor advisory, compliance, and execution.
            </p>
          </div>

          {/* Capabilities 3D Tilt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((svc) => {
              const IconComp = svc.icon;
              return (
                <TiltCard
                  key={svc.title}
                  glowColor="rgba(245, 158, 11, 0.2)"
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-8 flex flex-col justify-between group hover:border-amber-500/50 dark:hover:border-slate-700 shadow-md hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="p-2.5 sm:p-3.5 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-300 shadow-sm">
                        <IconComp size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {svc.tag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {svc.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6">
                      {svc.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1.5 transition-transform duration-300">
                    <span>Learn more</span>
                    <ChevronRight size={14} />
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: INTERACTIVE TRACKS (PERSONAS) ================= */}
      <section id="personas" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Stakeholder Tracks
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              Tailored Value for Every Stakeholder
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              Choose your role in India's startup growth story and unlock dedicated tooling.
            </p>
          </div>

          {/* Persona Tab Switcher (Horizontal scroll on mobile) */}
          <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-1">
            {Object.values(personas).map((p) => {
              const IconComp = p.icon;
              const isActive = activePersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePersona(p.id)}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? "text-white shadow-xl shadow-amber-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <IconComp size={15} className="relative z-10 shrink-0" />
                  <span className="relative z-10 whitespace-nowrap">{p.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Active Persona Spotlight Card */}
          <AnimatePresence mode="wait">
            {(() => {
              const current = personas[activePersona];
              const IconComp = current.icon;
              return (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 shadow-2xl backdrop-blur-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                    {/* Left Details */}
                    <div className="lg:col-span-7">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3 sm:mb-4">
                        <IconComp size={16} className="sm:w-5 sm:h-5" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                          {current.badge}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 sm:mb-4">
                        {current.title}
                      </h3>

                      <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 mb-5 sm:mb-8 leading-relaxed">
                        {current.tagline}
                      </p>

                      <div className="space-y-2.5 sm:space-y-3.5 mb-6 sm:mb-8">
                        {current.points.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 sm:gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                              <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                            </div>
                            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => navigate(current.route)}
                        className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{current.cta}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>

                    {/* Right Interactive Track Card */}
                    <div className="lg:col-span-5">
                      <div className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
                        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-200 dark:border-slate-800 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>TRACK CAPABILITIES</span>
                          <span className="text-amber-600 dark:text-amber-400">VERIFIED</span>
                        </div>

                        <div className="space-y-2 sm:space-y-2.5">
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-slate-700 dark:text-slate-300">Cohort Availability</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Open</span>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-slate-700 dark:text-slate-300">Mentorship Network</span>
                            <span className="font-bold text-slate-900 dark:text-white">150+ CXOs</span>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-slate-700 dark:text-slate-300">Legal Vault Access</span>
                            <span className="font-bold text-slate-900 dark:text-white">Included</span>
                          </div>
                        </div>

                        <div className="pt-1 sm:pt-2 text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
                          Free registration during Open Beta.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </section>

      {/* ================= SECTION 5: ROADMAP (HOW IT WORKS) ================= */}
      <section id="how-it-works" className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Structured Journey
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              How RealBell Accelerates Your Venture
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              A predictable 4-step framework from profile onboarding to closing capital and scaling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {roadmap.map((step) => {
              const IconComp = step.icon;
              return (
                <TiltCard
                  key={step.step}
                  glowColor="rgba(99, 102, 241, 0.15)"
                  className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col justify-between group hover:border-amber-500/50 shadow-md hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <span className="text-2xl sm:text-3xl font-black text-slate-300 dark:text-slate-700 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {step.step}
                      </span>
                      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-slate-950 transition-colors">
                        <IconComp size={18} className="sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 6: LIVE COHORTS & DEMO DAYS ================= */}
      <section id="demo-days" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Live Programs
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              Upcoming Cohorts &amp; Pitch Arenas
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              Apply to active sprints, masterclasses, and private demo day opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {upcomingPrograms.map((prog) => (
              <TiltCard
                key={prog.title}
                glowColor="rgba(52, 211, 153, 0.15)"
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-md hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-md border ${prog.color}`}>
                      {prog.badge}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold">{prog.category}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                    {prog.title}
                  </h3>

                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-2.5 sm:mb-3 flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{prog.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6">
                    {prog.desc}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/signup")}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight size={13} />
                </button>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 7: TESTIMONIALS ================= */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Ecosystem Voices
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              Backed by Founders &amp; Operators
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              Discover how ventures across India are leveraging RealBell to build and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <TiltCard
                key={t.author}
                glowColor="rgba(245, 158, 11, 0.15)"
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-xl"
              >
                <div>
                  <div className="flex gap-1 text-amber-500 dark:text-amber-400 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-4 sm:mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{t.author}</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">{t.role}, {t.company}</div>
                    <div className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{t.stage}</div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 8: FAQ ACCORDION ================= */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/60 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              Everything You Need to Know
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              Got questions about RealBell Business Foundation? We have answers.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-4 py-3.5 sm:px-6 sm:py-5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <span className="pr-3">{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-amber-600 dark:text-amber-400" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-4 sm:px-6 sm:pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-2.5 sm:pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 9: CALL TO ACTION BANNER ================= */}
      <section className="py-14 sm:py-20 relative z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-700 p-6 sm:p-10 lg:p-14 text-center shadow-2xl overflow-hidden border border-amber-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 text-white text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-3 sm:mb-4 border border-white/20">
                <Sparkles size={12} />
                Ready to accelerate?
              </span>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 sm:mb-6">
                Start Building on India's Premier Incubation Network
              </h2>

              <p className="text-amber-100 text-xs sm:text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
                Join founders, angel syndicates, and mentors driving the next chapter of enterprise innovation.
              </p>

              <button
                onClick={() => navigate("/signup")}
                className="w-full sm:w-auto px-7 py-3.5 sm:px-9 sm:py-4 rounded-xl bg-white text-slate-950 font-black text-sm sm:text-base shadow-2xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Create Foundation Account</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 10: FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-12 sm:pt-16 pb-8 sm:pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Logo & Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="RealBell Logo"
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain bg-white p-1 border border-slate-700 shadow-md"
                />
                <div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-white">
                    REAL<span className="text-amber-500">BELL</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Business Foundation
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-sm">
                Empowering India's next generation of entrepreneurial leaders through structured incubation, capital connections, strategic mentorship, and milestone accountability.
              </p>

              <div className="pt-1 text-[11px] sm:text-xs text-slate-500">
                Registered non-profit &amp; ecosystem entity based in Jaipur, Rajasthan, serving founders pan-India.
              </div>
            </div>

            {/* Ecosystem Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Ecosystem
              </h4>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Startups
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Angel Investors
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Mentors &amp; CXOs
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Incubators
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Accelerators
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Member Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Resources
              </h4>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Legal Contract Vault
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Startup Glossary
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Market Reports
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Masterclass Videos
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Milestone Tracker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter & Contact */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-3 sm:mb-4">
                Stay Updated
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-3 sm:mb-4 leading-relaxed">
                Receive cohort announcements and angel pitch notifications.
              </p>

              {newsletterSubscribed ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Subscribed to RBF Dispatch!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="founder@venture.com"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Subscribe to Dispatch
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.
            </div>
            <div className="flex gap-4 sm:gap-6">
              <a href="#" className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-400 transition-colors">
                Terms of Foundation
              </a>
              <a href="#" className="hover:text-slate-400 transition-colors">
                Code of Conduct
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
