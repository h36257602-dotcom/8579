"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
  banned: boolean;
  created_at: string;
};

export function useUser(): { user: User | null; profile: Profile | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (u: User | null) => {
      if (!u) { setProfile(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (mounted) setProfile((data as Profile) ?? null);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      if (!mounted) return;
      setUser(u);
      await loadProfile(u);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      if (!mounted) return;
      setUser(u);
      await loadProfile(u);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
