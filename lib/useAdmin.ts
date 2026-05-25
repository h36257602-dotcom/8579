"use client";
import { useEffect, useState } from "react";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(sessionStorage.getItem("admin_ok") === "1");
    const onStorage = () => setIsAdmin(sessionStorage.getItem("admin_ok") === "1");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return isAdmin;
}
