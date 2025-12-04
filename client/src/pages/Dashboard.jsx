import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { orders as ordersApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const userName = user?.user?.full_name || "Customer";
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "bidding");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Hello, {userName.split(" ")[0]}!</h2>
          <p className="text-slate-500 mt-1">Find your medicines easily</p>
        </div>

        <a
          href="/new-order"
          className="block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Upload Prescription</h3>
              <p className="text-emerald-100 text-sm mt-1">Get quotes from nearby pharmacies</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </a>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-800">{pendingOrders.length}</p>
            <p className="text-sm text-slate-500">Active Orders</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-800">{completedOrders.length}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Recent Orders</h3>
          <a href="/orders" className="text-emerald-600 text-sm font-medium">
            View All
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="font-medium text-slate-800 mb-1">No orders yet</h4>
            <p className="text-slate-500 text-sm">Upload your first prescription to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <a
                key={order.order_id}
                href={`/orders/${order.order_id}`}
                className="block bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <img
                    src={order.image_url}
                    alt="Prescription"
                    className="w-16 h-16 object-cover rounded-lg bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800 truncate">
                        Order #{order.order_id}
                      </p>
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
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      {order.description || "No description"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
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
