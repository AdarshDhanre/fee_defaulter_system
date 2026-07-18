export const getBackendUrl = (path: string = "") => {
  let baseUrl = "http://localhost:8080";
  
  // Prefer the environment variable for deployment setups
  if (process.env.NEXT_PUBLIC_API_URL) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
  } else if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If accessed via local network IP (e.g. 192.168.x.x), route to that IP's port 8080
    if (hostname !== "localhost" && !hostname.includes("onrender.com")) {
      baseUrl = `http://${hostname}:8080`;
    }
  }

  // Strip trailing slash if present to prevent double slashes (e.g. //api/auth)
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Returns the URL for the Python Flask backend (port 5000).
 * Used for static files like uploaded receipt images stored in /static/uploads/
 */
export const getPythonBackendUrl = (path: string = "") => {
  let baseUrl = "http://localhost:5000";

  // Use dedicated Python URL env var if set, else fall back to Java URL with port swap
  if (process.env.NEXT_PUBLIC_PYTHON_API_URL) {
    baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL;
  } else if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && !hostname.includes("onrender.com")) {
      baseUrl = `http://${hostname}:5000`;
    }
  }

  // Strip trailing slash if present to prevent double slashes
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
