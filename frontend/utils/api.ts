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
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
