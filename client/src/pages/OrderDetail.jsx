import React, { useState, useEffect } from "react";
import { orders as ordersApi, bids as bidsApi } from "../lib/api.js";
import { Layout } from "../components/Layout.jsx";

export function OrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);
  const [orderBids, setOrderBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAcceptBid = async (bidId) => {
    if (!confirm("Accept this bid? Other bids will be rejected.")) return;
    setActionLoading(true);
    try {
      await bidsApi.accept(bidId);
      await fetchData();
    } catch (error) {
      alert(error.message || "Failed to accept bid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm("Reject this bid?")) return;
    setActionLoading(true);
    try {
      await bidsApi.reject(bidId);
      await fetchData();
    } catch (error) {
      alert(error.message || "Failed to reject bid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Cancel this order?")) return;
    setActionLoading(true);
    try {
      await ordersApi.cancel(orderId);
      await fetchData();
    } catch (error) {
      alert(error.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="px-4 py-8 text-center">
          <p className="text-slate-500">Order not found</p>
          <a href="/orders" className="text-emerald-600 mt-2 inline-block">
            Back to orders
          </a>
        </div>
      </Layout>
    );
  }

  const acceptedBid = orderBids.find((b) => b.status === "accepted");

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <a href="/orders" className="p-2 -ml-2">
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
            className="w-full h-48 object-contain bg-slate-50"
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
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {order.radius_km && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {order.radius_km}km radius
                </span>
              )}
            </div>
          </div>
        </div>

        {(order.status === "pending" || order.status === "bidding") && (
          <button
            onClick={handleCancelOrder}
            disabled={actionLoading}
            className="w-full py-3 border border-red-200 text-red-600 rounded-lg mb-6 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Cancel Order
          </button>
        )}

        {acceptedBid && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-emerald-800 mb-2">Accepted Bid</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{acceptedBid.pharmacy_name}</p>
                <p className="text-sm text-slate-500">{acceptedBid.pharmacy_address}</p>
                {acceptedBid.pharmacy_phone && (
                  <a href={`tel:${acceptedBid.pharmacy_phone}`} className="text-emerald-600 text-sm">
                    {acceptedBid.pharmacy_phone}
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">Rs. {acceptedBid.price}</p>
              </div>
            </div>
            {acceptedBid.message && (
              <p className="text-sm text-slate-600 mt-2 bg-white p-2 rounded">
                {acceptedBid.message}
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Bids ({orderBids.length})
          </h3>

          {orderBids.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-slate-100">
              <p className="text-slate-500">No bids yet. Waiting for pharmacies...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderBids.map((bid) => (
                <div
                  key={bid.bid_id}
                  className={`bg-white rounded-xl p-4 border ${
                    bid.status === "accepted"
                      ? "border-emerald-300"
                      : bid.status === "rejected"
                      ? "border-red-200 opacity-60"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{bid.pharmacy_name}</p>
                      <p className="text-sm text-slate-500">{bid.pharmacy_address}</p>
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
                      <p className="text-xl font-bold text-emerald-600">Rs. {bid.price}</p>
                      {bid.status !== "pending" && (
                        <span
                          className={`text-xs font-medium ${
                            bid.status === "accepted" ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {bid.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {bid.message && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                      {bid.message}
                    </p>
                  )}

                  {bid.status === "pending" && order.status !== "completed" && order.status !== "cancelled" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptBid(bid.bid_id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid.bid_id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
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
