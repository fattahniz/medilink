import React, { useState, useEffect } from "react";
import { orders as ordersApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  return (
    <Layout>
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">My Orders</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {["all", "pending", "bidding", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === status
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <a
                key={order.order_id}
                href={`/orders/${order.order_id}`}
                className="block bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
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
                            : order.status === "bidding"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {order.description || "No description provided"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      {order.radius_km && <span>Radius: {order.radius_km}km</span>}
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
