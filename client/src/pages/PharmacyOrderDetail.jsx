import React, { useState, useEffect } from "react";
import { orders as ordersApi, bids as bidsApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function PharmacyOrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);
  const [orderBids, setOrderBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [orderData, bidsData] = await Promise.all([
        ordersApi.getOne(orderId),
        ordersApi.getBids(orderId),
      ]);
      setOrder(orderData);
      setOrderBids(bidsData);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setError("");

    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setSubmitting(true);

    try {
      await bidsApi.create({
        order_id: orderId,
        price: parseFloat(price),
        message: message || null,
      });
      await fetchData();
      setPrice("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="px-4 py-8 text-center">
          <p className="text-slate-500">Order not found</p>
          <a href="/pharmacy/orders" className="text-blue-600 mt-2 inline-block">
            Back to orders
          </a>
        </div>
      </Layout>
    );
  }

  const myBid = orderBids.find((b) => b.pharmacy_id === parseInt(localStorage.getItem("pharmacyId")));
  const canBid = order.status === "pending" || order.status === "bidding";

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <a href="/pharmacy/orders" className="p-2 -ml-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h2 className="text-xl font-bold text-slate-800">Order #{order.order_id}</h2>
        </div>

        <div className="bg-white rounded-xl overflow-hidden border border-slate-100 mb-4">
          <img
            src={order.image_url}
            alt="Prescription"
            className="w-full h-56 object-contain bg-slate-50"
          />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  order.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : order.status === "bidding"
                    ? "bg-blue-100 text-blue-700"
                    : order.status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span className="text-sm text-slate-400">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            {order.description && (
              <p className="text-slate-600 mb-3">{order.description}</p>
            )}
          </div>
        </div>

        {canBid && (
          <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4">
            <h3 className="font-semibold text-slate-800 mb-3">Place Your Bid</h3>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitBid} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Price (Rs.) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Any notes for the customer..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Bid"}
              </button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            All Bids ({orderBids.length})
          </h3>

          {orderBids.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-slate-100">
              <p className="text-slate-500">No bids yet. Be the first to bid!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderBids.map((bid) => (
                <div
                  key={bid.bid_id}
                  className={`bg-white rounded-xl p-4 border ${
                    bid.status === "accepted"
                      ? "border-emerald-300 bg-emerald-50"
                      : bid.status === "rejected"
                      ? "border-red-200 opacity-60"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{bid.pharmacy_name}</p>
                      {bid.pharmacy_rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-slate-600">{bid.pharmacy_rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">Rs. {bid.price}</p>
                      <span
                        className={`text-xs font-medium ${
                          bid.status === "accepted"
                            ? "text-emerald-600"
                            : bid.status === "rejected"
                            ? "text-red-500"
                            : "text-slate-400"
                        }`}
                      >
                        {bid.status}
                      </span>
                    </div>
                  </div>

                  {bid.message && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                      {bid.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
