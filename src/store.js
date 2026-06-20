(function () {
  async function request(path, options = {}) {
    const headers = { ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...(options.headers || {}) };
    const isJson = options.body && !options.rawBody;
    if (isJson && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(path, {
      headers,
      ...options,
      body: options.body ? (options.rawBody ? options.body : JSON.stringify(options.body)) : undefined
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed");
    return payload;
  }

  function makeId(label) {
    return (label || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
  }

  const publicState = () => request("/api/public/store");
  const createOrder = (order) => request("/api/public/orders", { method: "POST", body: order });
  const login = (password) => request("/api/admin/login", { method: "POST", body: { password } });
  const adminState = (token) => request("/api/admin/store", { token });
  const saveAdmin = (token, state) => request("/api/admin/store", { method: "PUT", token, body: state });
  const reset = (token) => request("/api/admin/reset", { method: "POST", token });
  const uploadAdminImage = (token, payload) => request("/api/admin/upload", { method: "POST", token, body: payload });

  window.LariStore = { publicState, createOrder, login, adminState, saveAdmin, reset, uploadAdminImage, makeId };
})();
