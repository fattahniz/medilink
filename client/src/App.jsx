import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Orders } from "./pages/Orders.jsx";
import { OrderDetail } from "./pages/OrderDetail.jsx";
import { NewOrder } from "./pages/NewOrder.jsx";
import { PharmacyDashboard } from "./pages/PharmacyDashboard.jsx";
import { PharmacyOrders } from "./pages/PharmacyOrders.jsx";
import { PharmacyOrderDetail } from "./pages/PharmacyOrderDetail.jsx";
import { PharmacyBids } from "./pages/PharmacyBids.jsx";
import { Notifications } from "./pages/Notifications.jsx";

function Router() {
  const { loading, isAuthenticated, isUser, isPharmacy } = useAuth();
  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (path === "/register") {
      return <Register />;
    }
    return <Login />;
  }

  if (isUser) {
    if (path === "/orders") {
      return <Orders />;
    }
    if (path.startsWith("/orders/")) {
      const orderId = parseInt(path.split("/")[2]);
      return <OrderDetail orderId={orderId} />;
    }
    if (path === "/new-order") {
      return <NewOrder />;
    }
    if (path === "/notifications") {
      return <Notifications />;
    }
    return <Dashboard />;
  }

  if (isPharmacy) {
    if (path === "/pharmacy/orders") {
      return <PharmacyOrders />;
    }
    if (path.startsWith("/pharmacy/orders/")) {
      const orderId = parseInt(path.split("/")[3]);
      return <PharmacyOrderDetail orderId={orderId} />;
    }
    if (path === "/pharmacy/bids") {
      return <PharmacyBids />;
    }
    if (path === "/notifications") {
      return <Notifications />;
    }
    return <PharmacyDashboard />;
  }

  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
