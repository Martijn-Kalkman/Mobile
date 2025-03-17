import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = "https://wubdvtolnnnummeglsep.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YmR2dG9sbm5udW1tZWdsc2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMDcwODAsImV4cCI6MjA1Nzc4MzA4MH0.alGwyltP4bJ_-f5wo1zgXKEAFTnHj4VE1T67dMNQuRI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch markers from Supabase
export const fetchMarkersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from("markers").select("*");
    if (error) {
      console.error("Supabase Fetch Error:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error fetching markers:", error);
    return [];
  }
};

// Function to save a marker to Supabase
export const saveMarkerToSupabase = async (markerData: {
  latitude: number;
  longitude: number;
  name: string;
}) => {
  try {
    const { error } = await supabase.from("markers").insert([markerData]);
    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error saving marker:", error);
    return false;
  }
};
