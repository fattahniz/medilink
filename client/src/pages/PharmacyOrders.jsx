import React, { useState, useEffect } from "react";
import { pharmacy as pharmacyApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await pharmacyApi.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Nearby Orders</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-slate-800 mb-1">No nearby orders</h4>
            <p className="text-slate-500 text-sm">Orders in your area will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <a
                key={order.order_id}
                href={`/pharmacy/orders/${order.order_id}`}
                className="block bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <img
                    src={order.image_url}
                    alt="Prescription"
                    className="w-20 h-20 object-cover rounded-lg bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">Order #{order.order_id}</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {order.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {order.distance ? `${parseFloat(order.distance).toFixed(1)}km` : "Nearby"}
                      </span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
