import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { notifications as notificationsApi } from "../lib/api.js";

export function Layout({ children }) {
  const { user, logout, isUser, isPharmacy } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const userName = isUser ? user?.user?.full_name : user?.pharmacy?.pharmacy_name;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-600 text-white sticky top-0 z-50 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h1 className="text-xl font-bold">MediLink</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a href="/notifications" className="relative p-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </a>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-2"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-medium">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-slate-700">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-sm truncate">{userName}</p>
                    <p className="text-xs text-slate-500">{isUser ? "Customer" : "Pharmacy"}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto pb-20">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50">
        <div className="max-w-lg mx-auto flex">
          {isUser ? (
            <>
              <NavItem href="/dashboard" icon="home" label="Home" />
              <NavItem href="/orders" icon="list" label="Orders" />
              <NavItem href="/new-order" icon="plus" label="New" isMain />
              <NavItem href="/notifications" icon="bell" label="Alerts" badge={unreadCount} />
            </>
          ) : (
            <>
              <NavItem href="/pharmacy" icon="home" label="Home" />
              <NavItem href="/pharmacy/orders" icon="list" label="Orders" />
              <NavItem href="/pharmacy/bids" icon="tag" label="My Bids" />
              <NavItem href="/notifications" icon="bell" label="Alerts" badge={unreadCount} />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label, isMain, badge }) {
  const isActive = window.location.pathname === href;
  
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
    bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    tag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  };

  return (
    <a
      href={href}
      className={`flex-1 flex flex-col items-center py-2 ${isMain ? "-mt-4" : ""}`}
    >
      {isMain ? (
        <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[icon]}
          </svg>
        </div>
      ) : (
        <>
          <div className="relative">
            <svg 
              className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-slate-400"}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {icons[icon]}
            </svg>
            {badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </div>
          <span className={`text-xs mt-1 ${isActive ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
            {label}
          </span>
        </>
      )}
    </a>
  );
}
