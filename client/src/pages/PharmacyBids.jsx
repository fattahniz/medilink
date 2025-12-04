import React, { useState, useEffect } from "react";
import { pharmacy as pharmacyApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function PharmacyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const data = await pharmacyApi.getBids();
      setBids(data);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = bids.filter((bid) => {
    if (filter === "all") return true;
    return bid.status === filter;
  });

  return (
    <Layout>
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">My Bids</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {["all", "pending", "accepted", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
            <p className="text-slate-500">No bids found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBids.map((bid) => (
              <div
                key={bid.bid_id}
                className={`bg-white rounded-xl p-4 border ${
                  bid.status === "accepted"
                    ? "border-emerald-300"
                    : bid.status === "rejected"
                    ? "border-red-200"
                    : "border-slate-100"
                }`}
              >
                <div className="flex gap-4">
                  {bid.order_image && (
                    <img
                      src={bid.order_image}
                      alt="Prescription"
                      className="w-16 h-16 object-cover rounded-lg bg-slate-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">Order #{bid.order_id}</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          bid.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : bid.status === "accepted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 mt-1">Rs. {bid.price}</p>
                    {bid.message && (
                      <p className="text-sm text-slate-500 mt-1 truncate">{bid.message}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(bid.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {bid.status === "accepted" && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-sm text-emerald-700">
                      Bid accepted! Customer will visit your pharmacy soon.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
