import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API_BASE = BACKEND_URL + "/api";
const http = axios.create({ baseURL: API_BASE, timeout: 30000 });
const auth = (token) => ({ headers: { Authorization: "Bearer " + token } });

export const api = {
  stats: () => http.get("/stats").then((r) => r.data),
  assemblies: () => http.get("/assemblies").then((r) => r.data),
  parts: (code) => http.get("/assemblies/" + code + "/parts").then((r) => r.data),
  search: (params) => http.get("/voters/search", { params }).then((r) => r.data),
  directory: (params, token) => http.get("/voters/directory", { params, ...auth(token) }).then((r) => r.data),
  sourcePdfUrl: (assemblyCode, partNo) => API_BASE + "/source-pdf/" + assemblyCode + "/" + partNo,
  adminLogin: (credentials) => http.post("/admin/login", credentials).then((r) => r.data),
  adminOverview: (token) => http.get("/admin/overview", auth(token)).then((r) => r.data),
  restartOcr: (token) => http.post("/admin/ocr/restart", {}, auth(token)).then((r) => r.data),
};
