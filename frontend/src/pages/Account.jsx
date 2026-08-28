import React, { useState, useEffect, useRef } from "react";
import { Bell, Pencil, Mail } from "lucide-react";
import { COLORS } from "../components/colors";
import { useStore } from "../zustand/store";
import Sidebar from "../components/Sidebar";
import axios from "../services/axios";
import { toast } from "react-toastify";

const DAY_MAP = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

// --- UI Components ---
function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "rgba(142, 27, 46, 0.14)" : "transparent",
        color: active ? COLORS.primary : COLORS.ink,
        fontWeight: 700,
        fontSize: 14.5,
        padding: "10px 16px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function FieldRow({ label, required, value, onChange, note, disabled, type = "text" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "start", gap: 24, marginBottom: 22 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.ink, paddingTop: 12 }}>
        {label}
        {required && <span style={{ color: COLORS.primary }}> *</span>}
      </div>
      <div>
        <input
          type={type}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          style={{
            width: "100%",
            border: `1px solid ${COLORS.border}`,
            outline: "none",
            background: disabled ? "rgba(100, 116, 139, 0.12)" : COLORS.inputBg,
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 14.5,
            fontWeight: 600,
            color: disabled ? COLORS.muted : COLORS.ink,
            boxSizing: "border-box",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {note && <div style={{ fontSize: 12.5, color: COLORS.muted, fontStyle: "italic", marginTop: 8 }}>{note}</div>}
      </div>
    </div>
  );
}

function OptionCard({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "13px 16px",
        borderRadius: 10,
        border: active ? `1.5px dashed ${COLORS.primary}` : `1px solid ${COLORS.border}`,
        background: COLORS.card,
        color: COLORS.ink,
        cursor: "pointer",
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? COLORS.primary : "#94A3B8"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {active && <div style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS.primary }} />}
      </div>
      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 46, height: 25, borderRadius: 20, border: "none", background: on ? COLORS.primary : "#475569", position: "relative", cursor: "pointer" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 24 : 3, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
    </button>
  );
}

// --- Sections ---

function PersonalInformation({ saving, formData, setFormData, onSave }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 512 * 1024) {
        toast.error("File size should be less than 512kb");
        return;
      }
      setFormData({ ...formData, imageFile: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 26 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.ink, marginBottom: 4 }}>Personal Information</div>
      <div style={{ height: 1, background: COLORS.border, margin: "14px -26px 22px" }} />

      {/* Profile Image Section */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 24, marginBottom: 30 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.ink, paddingTop: 10 }}>Profile Photo</div>
        <div>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                background: "rgba(142, 27, 46, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                border: `1px solid ${COLORS.border}`,
              }}
            >
              {preview || formData.account.image ? (
                <img src={preview || formData.account.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Bell size={48} color={COLORS.primary} />
              )}
            </div>
            {/* Pencil Icon Overlay */}
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: COLORS.card,
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                border: `1px solid ${COLORS.border}`,
                cursor: "pointer",
              }}
            >
              <Pencil size={16} color={COLORS.ink} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" style={{ display: "none" }} />
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 12 }}>
            Allowed file types: png, jpg, jpeg and max size of 512kb.
          </div>
        </div>
      </div>

      <FieldRow label="Full Name" required value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
      <FieldRow label="Email Address" required disabled value={formData.email} />
      <FieldRow label="Designation" required value={formData.account.designation} onChange={(v) => setFormData({ ...formData, account: { ...formData.account, designation: v } })} />
      <FieldRow label="Mobile Number" disabled value={formData.phone} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onSave} style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 700, cursor: "pointer" }} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function AvailabilityHours({ saving, formData, setFormData, onSave }) {
  const { availability } = formData.account;
  const updateAvailability = (key, value) => {
    setFormData({
      ...formData,
      account: {
        ...formData.account,
        availability: { ...availability, [key]: value },
      },
    });
  };
  const handleDayChange = (dayKey, field, value) => {
    const fullDayName = DAY_MAP[dayKey];
    let newList = [...availability.weekly_schedule];
    const index = newList.findIndex((d) => d.day === fullDayName);
    const updatedDay = index > -1 ? { ...newList[index], [field]: value } : { day: fullDayName, not_available: false, from: "09:00", to: "18:00", [field]: value };

    if (index > -1) newList[index] = updatedDay;
    else newList.push(updatedDay);

    updateAvailability("weekly_schedule", newList);
  };
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 26 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.ink }}>Manage Availability</div>
      <div style={{ height: 1, background: COLORS.border, margin: "14px -26px 22px" }} />
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {["Anytime", "Temporary Unavailable", "Specific Days"].map((m) => (
          <OptionCard key={m} label={m} active={availability.type === m} onClick={() => updateAvailability("type", m)} />
        ))}
      </div>

      {availability.type === "Specific Days" && (
        <div style={{ marginBottom: 28, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: COLORS.hoverBg, padding: "12px 18px", fontWeight: 800, fontSize: 13, color: COLORS.ink }}>
            <div>Day</div><div>Not Available</div><div>From</div><div>To</div>
          </div>
          {Object.keys(DAY_MAP).map((d) => {
            const dayData = availability.weekly_schedule.find((sd) => sd.day === DAY_MAP[d]) || { not_available: false, from: "09:00", to: "18:00" };
            return (
              <div key={d} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 18px", borderTop: `1px solid ${COLORS.border}`, alignItems: "center", color: COLORS.ink }}>
                <div style={{ fontWeight: 600 }}>{d}</div>
                <input type="checkbox" checked={dayData.not_available} onChange={(e) => handleDayChange(d, "not_available", e.target.checked)} />
                <select disabled={dayData.not_available} value={dayData.from} onChange={(e) => handleDayChange(d, "from", e.target.value)} style={{ padding: 6 }}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select disabled={dayData.not_available} value={dayData.to} onChange={(e) => handleDayChange(d, "to", e.target.value)} style={{ padding: 6 }}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {availability.type === "Temporary Unavailable" && (
        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>Unavailable From</label>
            <input type="date" style={{ width: "100%", padding: 10, marginTop: 5 }} onChange={(e) => updateAvailability("unavailable_from", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>Unavailable To</label>
            <input type="date" style={{ width: "100%", padding: 10, marginTop: 5 }} onChange={(e) => updateAvailability("unavailable_to", e.target.value)} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onSave} style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function EmailNotifications({ saving, formData, setFormData, onSave }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(142, 27, 46, 0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}><Mail size={20} color={COLORS.primary} /></div>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.ink }}>Email Notifications</div>
      </div>
      <div style={{ height: 1, background: COLORS.border, margin: "20px -26px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, color: COLORS.ink }}>Promotional Emails</div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>Receive updates about opportunities and events.</div>
        </div>
        <Toggle
          on={formData.account.promotion_email}
          onChange={(v) => setFormData({ ...formData, account: { ...formData.account, promotion_email: v } })}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
        <button onClick={onSave} style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { user } = useStore();
  const [tab, setTab] = useState("Personal Information");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    imageFile: null,
    account: {
      designation: "",
      image: "",
      promotion_email: false,
      availability: {
        type: "Anytime",
        weekly_schedule: [],
        specific_dates: [],
        unavailable_from: null,
        unavailable_to: null,
        reason: "",
      },
    },
  });

  useEffect(() => {
    document.title = "Account Settings | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Manage your RealBell Business Foundation user account, profile photo, contact preferences, and mentorship availability."
    );
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        imageFile: null,
        account: {
          designation: user.account?.designation || "",
          image: user.account?.image || "",
          promotion_email: user.account?.promotion_email || false,
          availability: user.account?.availability || { type: "Anytime", weekly_schedule: [] },
        },
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    setSaving(true);
    const data = new FormData();
    data.append("name", formData.name);
    if (formData.imageFile) {
      data.append("image", formData.imageFile);
    }
    data.append("account", JSON.stringify(formData.account));

    try {
      const res = await axios.post("/update-account", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === 1) {
        toast.success("Account updated successfully!");
      } else {
        toast.error(res.data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-0 lg:ml-75 flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen" style={{ background: COLORS.bg }}>
        <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-5">Account Settings</div>

        <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-1.5 sm:gap-2 mb-5 overflow-x-auto scrollbar-none">
          {["Personal Information", "Availability Hours", "Email Notifications"].map((t) => (
            <TabButton key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>

        {tab === "Personal Information" && (
          <PersonalInformation saving={saving} formData={formData} setFormData={setFormData} onSave={handleSubmit} />
        )}

        {tab === "Availability Hours" && (
          <AvailabilityHours
            saving={saving}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSubmit}
          />
        )}

        {tab === "Email Notifications" && (
          <EmailNotifications
            saving={saving}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default AccountPage;
