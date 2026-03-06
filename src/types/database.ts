// Firebase/Firestore-compatible type helpers
// (Replaces the old Supabase Database type definitions)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
