const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (
    configuredApiBaseUrl || "http://localhost:8080"
).replace(/\/+$/, "");

console.log("ChessVision API base URL:", API_BASE_URL);