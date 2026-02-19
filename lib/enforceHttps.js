export const enforceHttps = () => {
  const { protocol, hostname, href } = window.location;
  const isLocalhost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (protocol === "http:" && !isLocalhost) {
    window.location.replace(href.replace(/^http:/, "https:"));
    return true;
  }

  return false;
};
