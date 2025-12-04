import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../lib/api.js";

export function Register() {
  const { login } = useAuth();
  const [isUser, setIsUser] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    pharmacy_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    license_no: "",
    opening_hours: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (err) => {
          console.error("Location error:", err);
          alert("Could not get location. Please enter manually or allow location access.");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isUser) {
        data = await auth.registerUser({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          city: formData.city || null,
          address: formData.address || null,
        });
        login(data.token, { role: "user", ...data });
        window.location.href = "/dashboard";
      } else {
        data = await auth.registerPharmacy({
          pharmacy_name: formData.pharmacy_name,
          owner_name: formData.owner_name || null,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          city: formData.city || null,
          address: formData.address || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          license_no: formData.license_no || null,
          opening_hours: formData.opening_hours || null,
        });
        login(data.token, { role: "pharmacy", ...data });
        window.location.href = "/pharmacy";
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 to-emerald-600 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center text-white mb-6">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-emerald-100">Join MediLink today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsUser(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isUser ? "bg-white shadow text-emerald-600" : "text-slate-500"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setIsUser(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isUser ? "bg-white shadow text-emerald-600" : "text-slate-500"
              }`}
            >
              Pharmacy
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            {isUser ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Your full name"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    name="pharmacy_name"
                    value={formData.pharmacy_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Pharmacy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Owner name"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Your city"
              />
            </div>

            {!isUser && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="Longitude"
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      className="px-4 py-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Get current location"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    name="license_no"
                    value={formData.license_no}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Pharmacy license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="e.g., 9 AM - 10 PM"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a href="/login" className="text-emerald-600 font-medium">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
