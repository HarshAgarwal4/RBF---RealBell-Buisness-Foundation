import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import * as THREE from "three";
import { useStore } from "../zustand/store";
import { useTheme } from "../context/ThemeProvider";
import axios from "../services/axios";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";
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
  Phone,
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
    renderer.toneMappingExposure = isDark ? 1.25 : 1.18;
    container.appendChild(renderer.domElement);

    // --- 1. LIGHTING SETUP FOR METALLIC GOLD SHINE ---
    const ambientLight = new THREE.AmbientLight(isDark ? 0xfff5ea : 0xfffbeb, isDark ? 1.3 : 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(isDark ? 0xffd700 : 0xffedd5, isDark ? 2.4 : 3.2);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isDark ? 0x6366f1 : 0xfef08a, isDark ? 1.5 : 2.0);
    dirLight2.position.set(-15, -10, 10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(isDark ? 0xffbe28 : 0xf59e0b, isDark ? 2.6 : 2.8, 60);
    pointLight.position.set(0, 5, 12);
    scene.add(pointLight);

    // --- 2. GENERATE HIGH-RES COIN TEXTURE WITH ₹ EMBOSSED EMBLEM ---
    const createCoinTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // Radial Gold Gradient (Radiant & Warm for both modes, never muddy)
      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
      if (isDark) {
        grad.addColorStop(0, "#fffbeb");
        grad.addColorStop(0.25, "#fde047");
        grad.addColorStop(0.65, "#eab308");
        grad.addColorStop(0.9, "#ca8a04");
        grad.addColorStop(1, "#854d0e");
      } else {
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.25, "#fef08a");
        grad.addColorStop(0.6, "#fbbf24");
        grad.addColorStop(0.85, "#f59e0b");
        grad.addColorStop(1, "#d97706");
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2);
      ctx.fill();

      // Outer Gold Rim Ring
      ctx.strokeStyle = isDark ? "#fef08a" : "#fffbeb";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(256, 256, 235, 0, Math.PI * 2);
      ctx.stroke();

      // Inner Beveled Border
      ctx.strokeStyle = isDark ? "#a16207" : "#d97706";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, 256, 215, 0, Math.PI * 2);
      ctx.stroke();

      // Dotted Security Rim
      ctx.strokeStyle = isDark ? "#713f12" : "#b45309";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(256, 256, 198, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Embossed "REALBELL" Arced Text (Top)
      ctx.fillStyle = isDark ? "#78350f" : "#92400e";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("• REALBELL BUSINESS FOUNDATION •", 256, 80);

      // Central Rupee Symbol (₹) with 3D drop shadow
      ctx.shadowColor = isDark ? "rgba(113, 63, 18, 0.6)" : "rgba(217, 119, 6, 0.35)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;

      ctx.fillStyle = isDark ? "#713f12" : "#78350f";
      ctx.font = "900 170px 'Inter', sans-serif";
      ctx.fillText("₹", 256, 275);

      // Specular highlight on Rupee
      ctx.shadowColor = "transparent";
      ctx.fillStyle = isDark ? "#fef9c3" : "#ffffff";
      ctx.font = "900 170px 'Inter', sans-serif";
      ctx.fillText("₹", 252, 270);

      return new THREE.CanvasTexture(canvas);
    };

    const coinTexture = createCoinTexture();

    // --- 3. MATERIALS FOR 3D COIN MESH ---
    const coinGeometry = new THREE.CylinderGeometry(1.25, 1.25, 0.18, isMobile ? 32 : 48);

    const faceMaterial = new THREE.MeshStandardMaterial({
      map: coinTexture,
      metalness: isDark ? 0.88 : 0.28,
      roughness: isDark ? 0.22 : 0.3,
      emissive: isDark ? new THREE.Color(0x000000) : new THREE.Color(0xd97706),
      emissiveIntensity: isDark ? 0 : 0.35,
      envMapIntensity: 1.5,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: isDark ? 0xca8a04 : 0xf59e0b,
      metalness: isDark ? 0.95 : 0.3,
      roughness: isDark ? 0.18 : 0.25,
      emissive: isDark ? new THREE.Color(0x000000) : new THREE.Color(0xb45309),
      emissiveIntensity: isDark ? 0 : 0.25,
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
  const storeHomeData = useStore((state) => state.pageContents?.home);
  const [customHome, setCustomHome] = useState(storeHomeData || DEFAULT_PAGE_FALLBACKS.home);

  useEffect(() => {
    if (storeHomeData) {
      setCustomHome(storeHomeData);
    }
  }, [storeHomeData]);

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

  const stats = (customHome?.stats && customHome.stats.length > 0)
    ? customHome.stats.map((s, idx) => ({
        number: s.value,
        title: s.label,
        subtitle: s.subtext,
        icon: [Rocket, TrendingUp, Users, Award][idx % 4] || Rocket,
      }))
    : [
        { number: "500+", title: "Ventures Incubated", subtitle: "Across 20+ Sectors", icon: Rocket },
        { number: "₹45 Cr+", title: "Funding Catalyzed", subtitle: "Pre-seed & Seed", icon: TrendingUp },
        { number: "150+", title: "Industry Mentors", subtitle: "Founders & CXOs", icon: Users },
        { number: "40+", title: "Demo Days", subtitle: "Pan-India Tracks", icon: Award },
      ];

  const ICON_MAP = {
    Rocket,
    TrendingUp,
    Users,
    Building2,
    Handshake,
    Lightbulb,
    Target,
    Award,
    Globe,
    ShieldCheck,
    Shield,
    Layers,
    Zap,
    BookOpen,
    Calendar,
    FileText,
    Video,
    Compass,
    Star,
    BarChart3,
    CheckCircle2,
  };

  const rawPersonasCards = (customHome?.personasSection?.cards && customHome.personasSection.cards.length > 0)
    ? customHome.personasSection.cards
    : (DEFAULT_PAGE_FALLBACKS.home.personasSection?.cards || []);

  const personas = {};
  rawPersonasCards.forEach((card, idx) => {
    const key = card.id || `track_${idx}`;
    personas[key] = {
      id: key,
      title: card.title || card.role || "Ecosystem Track",
      icon: ICON_MAP[card.iconName] || [Rocket, TrendingUp, Users, Building2][idx % 4] || Rocket,
      tagline: card.tagline || card.description || "Unlock specialized tools and acceleration frameworks.",
      points: Array.isArray(card.points) && card.points.length > 0 ? card.points : [
        "Structured cohort incubation with milestone accountability",
        "Direct access to angel syndicates & grant programs",
        "1-on-1 strategic advisory with seasoned mentors",
        "Standardized legal vault: term sheets & compliance tools",
      ],
      badge: card.badge || card.role || `Track #${idx + 1}`,
      cta: card.actionText || card.cta || "Apply Now",
      route: card.actionLink || card.route || "/signup",
    };
  });

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

  const defaultRoadmap = [
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

  const roadmapList = (customHome?.howItWorksSection?.steps && customHome.howItWorksSection.steps.length > 0)
    ? customHome.howItWorksSection.steps.map((s, idx) => ({
        step: s.stepNumber || String(idx + 1).padStart(2, "0"),
        title: s.title,
        desc: s.description,
        icon: ICON_MAP[s.iconName] || [Users, Compass, Zap, Award][idx % 4] || Users,
      }))
    : defaultRoadmap;

  const defaultPrograms = [
    {
      title: "RBF Seed Sprint Cohort 2026",
      category: "Incubation",
      date: "Applications Open • March 2026",
      desc: "A hands-on 10-week sprint for early-stage founders to establish PMF, build distribution, and prepare for initial angel rounds.",
      badge: "Flagship",
      ctaText: "Apply Now",
      ctaLink: "/signup",
      color: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "All-India Angel Pitch Marathon",
      category: "Fundraising",
      date: "Bi-monthly • April 15, 2026",
      desc: "Exclusive live pitch arena presenting 12 shortlisted startups to a syndicate of 50+ accredited angel investors and micro-VCs.",
      badge: "Investor Arena",
      ctaText: "Pitch Deck Submission",
      ctaLink: "/signup",
      color: "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    },
    {
      title: "Masterclass: Compliance & Cap Tables",
      category: "Workshop",
      date: "Live Webinar • Alternate Friday",
      desc: "Expert breakdown of ESOP pools, convertible notes, Section 80-IAC tax exemptions, and founder vesting agreements.",
      badge: "Free for Members",
      ctaText: "Register Free",
      ctaLink: "/signup",
      color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  const cohortsList = (customHome?.demoDaysSection?.cohorts && customHome.demoDaysSection.cohorts.length > 0)
    ? customHome.demoDaysSection.cohorts.map((c, idx) => ({
        title: c.title,
        category: c.category || "Incubation",
        date: c.date || "Applications Open",
        desc: c.desc || c.description || "",
        badge: c.badge || "Flagship",
        ctaText: c.ctaText || "Apply Now",
        ctaLink: c.ctaLink || "/signup",
        color: [
          "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
          "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
          "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
        ][idx % 3],
      }))
    : defaultPrograms;

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

  const servicesList = (customHome?.servicesSection?.cards && customHome.servicesSection.cards.length > 0)
    ? customHome.servicesSection.cards.map((c, idx) => ({
        icon: [Rocket, Handshake, Users, ShieldCheck, BookOpen, Target][idx % 6] || Rocket,
        title: c.title,
        desc: c.description,
        tag: c.tag || "Core",
      }))
    : services;

  const testimonialsList = (customHome?.testimonialsSection?.items && customHome.testimonialsSection.items.length > 0)
    ? customHome.testimonialsSection.items.map((t, idx) => ({
        quote: t.quote,
        author: t.author,
        role: t.role,
        company: t.company,
        stage: t.stage || "Verified Member",
        avatar: t.avatar || [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
        ][idx % 3],
      }))
    : testimonials;

  const faqsList = (customHome?.faqSection?.faqs && customHome.faqSection.faqs.length > 0)
    ? customHome.faqSection.faqs.map((f) => ({
        q: f.question,
        a: f.answer,
      }))
    : faqs;

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && /^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-stone-900 dark:text-slate-100 selection:bg-amber-500/30 selection:text-amber-950 dark:selection:text-amber-200 overflow-x-hidden font-['Inter',sans-serif] transition-colors duration-300">
      
      {/* FULL-PAGE FIXED 3D RAINING GOLD COINS CANVAS LAYER */}
      <Hero3DCanvas isDark={isDark} />

      {/* Top Global Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-400 z-50 origin-left shadow-lg shadow-amber-500/50"
        style={{ scaleX }}
      />

      {/* Floating Vertical Section Indicator / Slide Dock */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl p-2.5 rounded-full border border-stone-200 dark:border-slate-800/80 shadow-2xl shadow-stone-300/40 dark:shadow-black/60">
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
                  : "bg-stone-300 dark:bg-slate-700 hover:bg-stone-400 dark:hover:bg-slate-500"
              }`}
            />
            <span className="absolute right-7 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
              {s.label}
            </span>
          </a>
        ))}
      </div>

      {/* Top Notification / Live Ticker Bar */}
      {customHome?.navbar?.showLiveTicker && customHome?.navbar?.tickerText && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 text-white text-[11px] sm:text-xs font-bold py-1.5 px-4 text-center relative z-40 shadow-sm flex items-center justify-center gap-2">
          <Sparkles size={13} className="shrink-0" />
          <span>{customHome.navbar.tickerText}</span>
        </div>
      )}

      {/* ================= STICKY NAVBAR ================= */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#faf8f5]/90 dark:bg-slate-950/80 border-b border-stone-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-500 opacity-30 dark:opacity-40 blur-sm group-hover:opacity-70 transition duration-300" />
              <img
                src="/logo.png"
                alt="RealBell Foundation Logo"
                className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 sm:p-1.5 border border-stone-200 dark:border-slate-800 shadow-md"
              />
            </div>
            <div>
              <div className="text-base sm:text-xl font-black tracking-tight text-stone-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
                <span>
                  {(customHome?.navbar?.brandName || "REAL").toUpperCase().endsWith((customHome?.navbar?.brandHighlight || "BELL").toUpperCase()) && (customHome?.navbar?.brandName || "REAL").length > (customHome?.navbar?.brandHighlight || "BELL").length
                    ? (customHome?.navbar?.brandName || "REAL").substring(0, (customHome?.navbar?.brandName || "REAL").length - (customHome?.navbar?.brandHighlight || "BELL").length)
                    : (customHome?.navbar?.brandName || "REAL")}
                </span>
                <span className="text-amber-600 dark:text-amber-500">{customHome?.navbar?.brandHighlight || "BELL"}</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-md">
                  Foundation
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-stone-500 dark:text-slate-400 leading-none sm:leading-normal">
                {customHome?.navbar?.subtitle || "Empowering India's Entrepreneurs"}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-stone-600 dark:text-slate-300">
            {(customHome?.navbar?.navLinks || [
              { label: "Capabilities", href: "#services" },
              { label: "Tracks", href: "#personas" },
              { label: "Roadmap", href: "#how-it-works" },
              { label: "Cohorts", href: "#demo-days" },
              { label: "FAQ", href: "#faq" },
            ]).map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3.5">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 hover:border-stone-300 dark:hover:border-slate-700 text-sm font-bold text-stone-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
            >
              {customHome?.navbar?.loginButtonText || "Login"}
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{customHome?.navbar?.registerButtonText || "Join Ecosystem"}</span>
              <ArrowRight size={15} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 cursor-pointer"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 cursor-pointer"
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
      <section id="hero" className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center pt-6 pb-16 sm:pt-8 sm:pb-20 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] h-[250px] sm:h-[450px] bg-gradient-to-tr from-amber-400/20 via-orange-300/15 to-transparent dark:from-amber-500/15 dark:via-indigo-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />

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
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-amber-400/40 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/10 backdrop-blur-md mb-4 sm:mb-6 shadow-xs max-w-full">
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-amber-600 dark:bg-amber-500" />
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 truncate">
                  {customHome?.hero?.badgeText || "India's Premier Business Incubation Ecosystem"}
                </span>
              </motion.div>

              {/* Main Headline (Fully Responsive for Mobile) */}
              <motion.h1
                variants={fadeInUp}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-[1.18] sm:leading-[1.12] mb-4 sm:mb-6"
              >
                {customHome?.hero?.mainHeadline || "Where High-Growth"} <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 dark:from-amber-400 dark:via-amber-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  {customHome?.hero?.headlineHighlight || "Founders & Capital Converge"}
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeInUp}
                className="text-sm sm:text-base lg:text-lg text-stone-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8"
              >
                {customHome?.hero?.description || "RealBell Business Foundation bridges early-stage startups with institutional angel syndicates, veteran CXO mentors, cohort acceleration programs, and verified legal frameworks."}
              </motion.p>

              {/* Primary CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-12"
              >
                <button
                  onClick={() => navigate(customHome?.hero?.primaryButtonLink || "/signup")}
                  className="w-full sm:w-auto relative group overflow-hidden px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-sm sm:text-base font-bold text-white shadow-xl shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{customHome?.hero?.primaryButtonText || "Apply For Incubation"}</span>
                  <Rocket size={17} className="relative z-10 group-hover:rotate-12 transition-transform" />
                </button>

                <a
                  href={customHome?.hero?.secondaryButtonLink || "#personas"}
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 hover:border-stone-300 dark:hover:border-slate-700 text-sm sm:text-base font-bold text-stone-800 dark:text-slate-200 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{customHome?.hero?.secondaryButtonText || "Explore Tracks"}</span>
                  <ArrowRight size={16} />
                </a>
              </motion.div>

              {/* Trust Badges (Stacked on small screens) */}
              <motion.div
                variants={fadeInUp}
                className="pt-4 sm:pt-6 border-t border-stone-200 dark:border-slate-900/80 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-6 text-xs text-stone-600 dark:text-slate-400 font-medium"
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
              <TiltCard className="bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-stone-200 dark:border-slate-800/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 dark:border-slate-800 mb-4 sm:mb-5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] sm:text-xs font-mono text-stone-400 dark:text-slate-500 ml-1 sm:ml-2">rbf-ecosystem-live.io</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ONLINE
                  </span>
                </div>

                {/* Simulated Live Ecosystem Feed */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Item 1 */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-slate-900/90 border border-stone-200/80 dark:border-slate-800 hover:border-amber-500/40 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <TrendingUp size={13} className="text-emerald-500 dark:text-emerald-400" />
                        Seed Capital Closed
                      </span>
                      <span className="text-stone-400 dark:text-slate-500 text-[10px]">2h ago</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 leading-snug">
                      NexusHealth closed <strong className="text-amber-600 dark:text-amber-400">₹1.8 Cr</strong> angel round with Apex Syndicate.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-slate-900/90 border border-stone-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <Rocket size={13} className="text-indigo-500 dark:text-indigo-400" />
                        New Cohort Intake
                      </span>
                      <span className="text-stone-400 dark:text-slate-500 text-[10px]">Active</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 leading-snug">
                      Sprint 2026 Batch: 24 Startups shortlisted for demo day presentations.
                    </p>
                  </div>

                  {/* Item 3: Milestone Progress Bar */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-slate-900/90 border border-stone-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5 sm:mb-2">
                      <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <Target size={13} className="text-amber-500 dark:text-amber-400" />
                        Milestone Velocity
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">92% On-Track</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
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
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
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
      <section className="py-8 sm:py-12 bg-white/70 dark:bg-slate-900/50 border-y border-stone-200/80 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {stats.map((stat) => {
              const IconComp = stat.icon;
              return (
                <TiltCard
                  key={stat.title}
                  glowColor="rgba(99, 102, 241, 0.15)"
                  className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4 sm:p-6 text-center shadow-xs"
                >
                  <div className="inline-flex p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 sm:mb-3 border border-amber-500/20">
                    <IconComp size={18} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-slate-200 mb-0.5">
                    {stat.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400">
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
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {customHome?.servicesSection?.badge || "Full-Stack Acceleration"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.servicesSection?.title || "Everything Your Venture Needs to Scale"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.servicesSection?.subtitle || "A complete institutional suite designed to eliminate roadblocks in fundraising, mentor advisory, compliance, and execution."}
            </p>
          </div>

          {/* Capabilities 3D Tilt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {servicesList.map((svc, sIdx) => {
              const IconComp = svc.icon || Rocket;
              return (
                <TiltCard
                  key={svc.title || sIdx}
                  glowColor="rgba(245, 158, 11, 0.2)"
                  className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800/80 p-5 sm:p-8 flex flex-col justify-between group hover:border-amber-500/50 dark:hover:border-slate-700 shadow-md hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="p-2.5 sm:p-3.5 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-300 shadow-sm">
                        <IconComp size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-slate-400 bg-stone-100 dark:bg-slate-800/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-stone-200 dark:border-slate-700">
                        {svc.tag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mb-2 sm:mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {svc.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6">
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
      <section id="personas" className="py-16 sm:py-24 bg-[#f4f1ea] dark:bg-slate-900/40 border-y border-stone-200/80 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-800 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              {customHome?.personasSection?.badge || "Stakeholder Tracks"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.personasSection?.title || "Tailored Value for Every Stakeholder"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.personasSection?.subtitle || "Choose your role in India's startup growth story and unlock dedicated tooling."}
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
                      : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 shadow-xs"
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
              const current = personas[activePersona] || Object.values(personas)[0] || {
                id: "default",
                title: "Stakeholder Track",
                icon: Rocket,
                badge: "Track",
                tagline: "Accelerate your journey with tailored frameworks.",
                points: [],
                cta: "Apply Now",
                route: "/signup",
              };
              const IconComp = current.icon || Rocket;
              return (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 shadow-2xl backdrop-blur-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                    {/* Left Details */}
                    <div className="lg:col-span-7">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 mb-3 sm:mb-4">
                        <IconComp size={16} className="sm:w-5 sm:h-5" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                          {current.badge}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-white mb-2 sm:mb-4">
                        {current.title}
                      </h3>

                      <p className="text-xs sm:text-sm lg:text-base text-stone-600 dark:text-slate-300 mb-5 sm:mb-8 leading-relaxed">
                        {current.tagline}
                      </p>

                      <div className="space-y-2.5 sm:space-y-3.5 mb-6 sm:mb-8">
                        {(current.points || []).map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 sm:gap-3">
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                              <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                            </div>
                            <span className="text-xs sm:text-sm text-stone-700 dark:text-slate-300 font-medium">
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => navigate(current.route || "/signup")}
                        className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{current.cta || "Apply Now"}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>

                    {/* Right Interactive Track Card */}
                    <div className="lg:col-span-5">
                      <div className="bg-stone-50 dark:bg-slate-950/90 border border-stone-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
                        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-stone-200 dark:border-slate-800 text-[10px] sm:text-xs font-bold text-stone-500 dark:text-slate-400">
                          <span>TRACK CAPABILITIES</span>
                          <span className="text-amber-600 dark:text-amber-400">VERIFIED</span>
                        </div>

                        <div className="space-y-2 sm:space-y-2.5">
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-stone-700 dark:text-slate-300">Cohort Availability</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Open</span>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-stone-700 dark:text-slate-300">Mentorship Network</span>
                            <span className="font-bold text-stone-900 dark:text-white">150+ CXOs</span>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-stone-700 dark:text-slate-300">Legal Vault Access</span>
                            <span className="font-bold text-stone-900 dark:text-white">Included</span>
                          </div>
                        </div>

                        <div className="pt-1 sm:pt-2 text-center text-[10px] sm:text-[11px] text-stone-400 dark:text-slate-500">
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
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {customHome?.howItWorksSection?.badge || "Structured Journey"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.howItWorksSection?.title || "How RealBell Accelerates Your Venture"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.howItWorksSection?.subtitle || "A predictable 4-step framework from profile onboarding to closing capital and scaling."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {roadmapList.map((step, rIdx) => {
              const IconComp = step.icon || Users;
              return (
                <TiltCard
                  key={step.step || rIdx}
                  glowColor="rgba(99, 102, 241, 0.15)"
                  className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col justify-between group hover:border-amber-500/50 shadow-md hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <span className="text-2xl sm:text-3xl font-black text-stone-300 dark:text-slate-700 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {step.step}
                      </span>
                      <div className="p-2 sm:p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-slate-950 transition-colors">
                        <IconComp size={18} className="sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mb-1.5 sm:mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
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
      <section id="demo-days" className="py-16 sm:py-24 bg-[#f4f1ea] dark:bg-slate-900/40 border-y border-stone-200/80 dark:border-slate-800/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {customHome?.demoDaysSection?.badge || "Live Programs"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.demoDaysSection?.title || "Upcoming Cohorts & Pitch Arenas"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.demoDaysSection?.subtitle || "Apply to active sprints, masterclasses, and private demo day opportunities."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {cohortsList.map((prog, pIdx) => {
              const isHighlight = pIdx === 0 && customHome?.demoDaysSection?.highlightTitle;
              const displayTitle = isHighlight ? customHome.demoDaysSection.highlightTitle : prog.title;
              const displayDesc = isHighlight ? (customHome.demoDaysSection.highlightSubtitle || prog.desc) : prog.desc;
              const displayDate = isHighlight ? (customHome.demoDaysSection.highlightDate || prog.date) : prog.date;
              const ctaText = isHighlight ? (customHome.demoDaysSection.ctaText || prog.ctaText || "Apply Now") : (prog.ctaText || "Apply Now");
              const ctaLink = isHighlight ? (customHome.demoDaysSection.ctaLink || prog.ctaLink || "/signup") : (prog.ctaLink || "/signup");

              return (
                <TiltCard
                  key={prog.title || pIdx}
                  glowColor="rgba(52, 211, 153, 0.15)"
                  className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-md hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-md border ${prog.color || "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"}`}>
                        {prog.badge}
                      </span>
                      <span className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-500 font-semibold">{prog.category}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mb-1.5 sm:mb-2">
                      {displayTitle}
                    </h3>

                    <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-2.5 sm:mb-3 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{displayDate}</span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6">
                      {displayDesc}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(ctaLink)}
                    className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{ctaText}</span>
                    <ArrowRight size={13} />
                  </button>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 7: TESTIMONIALS ================= */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {customHome?.testimonialsSection?.badge || "Ecosystem Voices"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.testimonialsSection?.title || "Backed by Founders & Operators"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.testimonialsSection?.subtitle || "Discover how ventures across India are leveraging RealBell to build and scale."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonialsList.map((t, tIdx) => (
              <TiltCard
                key={t.author || tIdx}
                glowColor="rgba(245, 158, 11, 0.15)"
                className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-xl"
              >
                <div>
                  <div className="flex gap-1 text-amber-500 dark:text-amber-400 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 leading-relaxed italic mb-4 sm:mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3.5 sm:pt-4 border-t border-stone-100 dark:border-slate-800/80">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-stone-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">{t.author}</div>
                    <div className="text-[10px] sm:text-[11px] text-stone-500 dark:text-slate-400">{t.role}, {t.company}</div>
                    <div className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{t.stage}</div>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 8: FAQ ================= */}
      <section id="faq" className="py-16 sm:py-24 bg-[#f4f1ea] dark:bg-slate-900/40 border-y border-stone-200/80 dark:border-slate-800/60 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-800 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              {customHome?.faqSection?.badge || "Frequently Asked Questions"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-3 sm:mt-4 mb-3 sm:mb-4">
              {customHome?.faqSection?.title || "Everything You Need to Know"}
            </h2>
            <p className="text-stone-600 dark:text-slate-400 text-xs sm:text-sm sm:text-base">
              {customHome?.faqSection?.subtitle || "Got questions about RealBell Business Foundation? We have answers."}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqsList.map((faq, fIdx) => {
              const isOpen = openFaq === fIdx;
              return (
                <div
                  key={faq.question || fIdx}
                  className="bg-white dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                      {faq.question || faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-stone-500 dark:text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-amber-600 dark:text-amber-400" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-5 sm:px-6 pb-4 sm:pb-6 text-xs sm:text-sm text-stone-600 dark:text-slate-400 leading-relaxed border-t border-stone-100 dark:border-slate-800/80 pt-3 sm:pt-4">
                          {faq.answer || faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 9: CTA BANNER ================= */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 p-8 sm:p-12 lg:p-16 text-center text-white overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/15 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight leading-tight">
                {customHome?.ctaBanner?.title || "Start Building on India's Premier Incubation Network"}
              </h2>

              <p className="text-xs sm:text-sm sm:text-base lg:text-lg text-amber-100/90 leading-relaxed">
                {customHome?.ctaBanner?.subtitle || "Join founders, angel syndicates, and mentors driving the next chapter of enterprise innovation."}
              </p>

              <button
                onClick={() => navigate(customHome?.ctaBanner?.buttonLink || "/signup")}
                className="px-6 sm:px-10 py-3 sm:py-4 rounded-xl bg-white text-stone-900 font-extrabold text-xs sm:text-sm lg:text-base hover:bg-stone-100 shadow-xl transition-all hover:scale-105 cursor-pointer inline-flex items-center gap-2"
              >
                <span>{customHome?.ctaBanner?.buttonText || "Create Foundation Account"}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 10: FOOTER ================= */}
      <footer className="bg-[#181513] dark:bg-slate-950 text-stone-300 dark:text-slate-300 border-t border-stone-800 dark:border-slate-800 pt-10 sm:pt-12 pb-6 sm:pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
            {/* Column 1: Logo & Mission Tagline */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="RealBell Logo"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain bg-white p-1 border border-stone-700 shadow-md"
                />
                <div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center">
                    <span>
                      {(customHome?.navbar?.brandName || "REAL").toUpperCase().endsWith((customHome?.navbar?.brandHighlight || "BELL").toUpperCase()) && (customHome?.navbar?.brandName || "REAL").length > (customHome?.navbar?.brandHighlight || "BELL").length
                        ? (customHome?.navbar?.brandName || "REAL").substring(0, (customHome?.navbar?.brandName || "REAL").length - (customHome?.navbar?.brandHighlight || "BELL").length)
                        : (customHome?.navbar?.brandName || "REAL")}
                    </span>
                    <span className="text-amber-500">{customHome?.navbar?.brandHighlight || "BELL"}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-slate-500">
                    {customHome?.navbar?.subtitle || "Business Foundation"}
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-stone-400 dark:text-slate-400 max-w-sm">
                {customHome?.footer?.brandDescription || "Empowering India's next generation of entrepreneurial leaders through structured incubation, capital connections, strategic mentorship, and milestone accountability."}
              </p>

              {customHome?.footer?.address && (
                <div className="text-[11px] text-stone-400 dark:text-slate-500 flex items-start gap-1.5 max-w-sm pt-1">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{customHome.footer.address}</span>
                </div>
              )}

              {/* Direct Support Email & Phone Side-by-Side Below Address */}
              {(customHome?.footer?.contactEmail || customHome?.footer?.contactPhone) && (
                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs">
                  {customHome.footer.contactEmail && (
                    <a
                      href={`mailto:${customHome.footer.contactEmail}`}
                      className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-400 transition-colors"
                    >
                      <Mail size={12} className="text-amber-400 shrink-0" />
                      <span>{customHome.footer.contactEmail}</span>
                    </a>
                  )}
                  {customHome.footer.contactPhone && (
                    <a
                      href={`tel:${customHome.footer.contactPhone}`}
                      className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-400 transition-colors"
                    >
                      <Phone size={12} className="text-amber-400 shrink-0" />
                      <span>{customHome.footer.contactPhone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Ecosystem Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-3">
                Ecosystem
              </h4>
              <ul className="space-y-2 text-xs">
                {(customHome?.footer?.ecosystemLinks && customHome.footer.ecosystemLinks.length > 0) ? (
                  customHome.footer.ecosystemLinks.map((lnk, idx) => (
                    <li key={idx}>
                      <Link to={lnk.href || "/signup"} className="hover:text-amber-400 transition-colors">
                        {lnk.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link to="/signup" className="hover:text-amber-400 transition-colors">For Startups</Link></li>
                    <li><Link to="/signup" className="hover:text-amber-400 transition-colors">For Angel Investors</Link></li>
                    <li><Link to="/signup" className="hover:text-amber-400 transition-colors">For Mentors &amp; CXOs</Link></li>
                    <li><Link to="/signup" className="hover:text-amber-400 transition-colors">For Incubators</Link></li>
                    <li><Link to="/signup" className="hover:text-amber-400 transition-colors">For Accelerators</Link></li>
                    <li><Link to="/login" className="hover:text-amber-400 transition-colors">Member Dashboard</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 3: Resources Links */}
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-3">
                Resources
              </h4>
              <ul className="space-y-2 text-xs">
                {(customHome?.footer?.quickLinks && customHome.footer.quickLinks.length > 0) ? (
                  customHome.footer.quickLinks.map((lnk, idx) => (
                    <li key={idx}>
                      <Link to={lnk.href || "#"} className="hover:text-amber-400 transition-colors">
                        {lnk.label}
                      </Link>
                    </li>
                  ))
                ) : (customHome?.footer?.resourceLinks && customHome.footer.resourceLinks.length > 0) ? (
                  customHome.footer.resourceLinks.map((lnk, idx) => (
                    <li key={idx}>
                      <Link to={lnk.href || "#"} className="hover:text-amber-400 transition-colors">
                        {lnk.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li><Link to="/resources/contracts" className="hover:text-amber-400 transition-colors">Legal Contract Vault</Link></li>
                    <li><Link to="/resources/glossary" className="hover:text-amber-400 transition-colors">Startup Glossary</Link></li>
                    <li><Link to="/resources/reports" className="hover:text-amber-400 transition-colors">Market Reports</Link></li>
                    <li><Link to="/resources/videos" className="hover:text-amber-400 transition-colors">Masterclass Videos</Link></li>
                    <li><Link to="/milestones" className="hover:text-amber-400 transition-colors">Milestone Tracker</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 4: Newsletter & Support Dispatch */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                {customHome?.footer?.newsletterTitle || "Stay Updated"}
              </h4>
              <p className="text-[11px] text-stone-400 dark:text-slate-400 leading-relaxed">
                {customHome?.footer?.newsletterSubtitle || "Receive cohort announcements and angel pitch notifications."}
              </p>

              {newsletterSubscribed ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>Subscribed to RBF Dispatch!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="founder@venture.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 dark:bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-stone-500 dark:placeholder:text-slate-600 outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Subscribe to Dispatch
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Bar: Copyright, Social Handles CRUD, Legal Terms */}
          <div className="mt-8 sm:mt-12 pt-6 border-t border-stone-800/80 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-stone-400 dark:text-slate-500">
            {/* Copyright */}
            <div className="order-3 md:order-1 text-center md:text-left">
              © {new Date().getFullYear()} {customHome?.footer?.copyrightText || "RealBell Business Foundation. All Rights Reserved."}
            </div>

            {/* Social Icons Row */}
            {(() => {
              const socialList = Array.isArray(customHome?.footer?.socialLinksList) && customHome.footer.socialLinksList.length > 0
                ? customHome.footer.socialLinksList
                : Object.entries(customHome?.footer?.socialLinks || {})
                    .filter(([_, url]) => Boolean(url))
                    .map(([platform, url]) => ({ platform, url }));

              if (socialList.length === 0) return null;

              return (
                <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-2">
                  {socialList.map((soc, idx) => {
                    const plat = (soc.platform || "twitter").toLowerCase();
                    return (
                      <a
                        key={idx}
                        href={soc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-stone-900/90 dark:bg-slate-900 border border-stone-700/60 hover:border-amber-500/60 text-stone-400 hover:text-amber-400 transition-all hover:scale-105 shadow-xs flex items-center justify-center"
                        title={soc.label || plat.toUpperCase()}
                      >
                        {plat === "twitter" || plat === "x" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        ) : plat === "linkedin" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.75a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6z"/></svg>
                        ) : plat === "instagram" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        ) : plat === "facebook" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        ) : plat === "youtube" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        ) : plat === "github" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        ) : plat === "discord" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        ) : plat === "telegram" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                        ) : plat === "whatsapp" ? (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/></svg>
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            })()}

            {/* Legal Terms */}
            <div className="order-2 md:order-3 flex gap-4 sm:gap-6">
              <Link to="/privacy-policy" className="hover:text-stone-200 dark:hover:text-slate-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-stone-200 dark:hover:text-slate-400 transition-colors">
                Terms of Foundation
              </Link>
              <Link to="/code-of-conduct" className="hover:text-stone-200 dark:hover:text-slate-400 transition-colors">
                Code of Conduct
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
