// src/routes/RequireAuth.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const access = useSelector((s) => s.auth.access);
  const loc = useLocation();
  if (!access) {
    return (
      <Navigate
        to={`/users/login?next=${encodeURIComponent(
          loc.pathname + loc.search
        )}`}
        replace
      />
    );
  }
  return children;
}
