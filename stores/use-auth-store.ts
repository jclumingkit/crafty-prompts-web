import { UserProfileTableRow } from "@/utils/supabase/types";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  userProfile: UserProfileTableRow | null;
  setUserProfile: (profile: AuthState["userProfile"]) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  userProfile: null,
  setUserProfile: (userProfile) => set({ userProfile }),
}));

export default useAuthStore;
