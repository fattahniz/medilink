const getToken = () => localStorage.getItem("token");

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const api = {
  get: (url) => request(url, { method: "GET" }),
  post: (url, data) => request(url, { method: "POST", body: JSON.stringify(data) }),
  patch: (url, data) => request(url, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: (url) => request(url, { method: "DELETE" }),
  upload: (url, formData) => request(url, { method: "POST", body: formData }),
};

export const auth = {
  registerUser: (data) => api.post("/api/auth/register/user", data),
  registerPharmacy: (data) => api.post("/api/auth/register/pharmacy", data),
  loginUser: (data) => api.post("/api/auth/login/user", data),
  loginPharmacy: (data) => api.post("/api/auth/login/pharmacy", data),
  getMe: () => api.get("/api/auth/me"),
};

export const orders = {
  create: (formData) => api.upload("/api/orders", formData),
  getAll: () => api.get("/api/orders"),
  getOne: (id) => api.get(`/api/orders/${id}`),
  getBids: (id) => api.get(`/api/orders/${id}/bids`),
  cancel: (id) => api.patch(`/api/orders/${id}/cancel`),
};

export const pharmacy = {
  getOrders: () => api.get("/api/pharmacy/orders"),
  getBids: () => api.get("/api/pharmacy/bids"),
};

export const bids = {
  create: (data) => api.post("/api/bids", data),
  accept: (id) => api.patch(`/api/bids/${id}/accept`),
  reject: (id) => api.patch(`/api/bids/${id}/reject`),
};

export const notifications = {
  getAll: () => api.get("/api/notifications"),
  getUnreadCount: () => api.get("/api/notifications/unread-count"),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/notifications/read-all"),
};
