import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = "https://wubdvtolnnnummeglsep.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YmR2dG9sbm5udW1tZWdsc2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMDcwODAsImV4cCI6MjA1Nzc4MzA4MH0.alGwyltP4bJ_-f5wo1zgXKEAFTnHj4VE1T67dMNQuRI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch markers from Supabase
export const fetchMarkersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from("markers").select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching markers:", error);
    return [];
  }
};

// Save a new marker
export const saveMarkerToSupabase = async (markerData) => {
  try {
    const { error } = await supabase.from("markers").insert([markerData]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving marker:", error);
    return false;
  }
};

// Delete a marker
export const deleteMarkerFromSupabase = async (latitude, longitude) => {
  try {
    const { error } = await supabase
      .from("markers")
      .delete()
      .eq("latitude", latitude)
      .eq("longitude", longitude);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting marker:", error);
    return false;
  }
};

// Real-time subscription function
export const subscribeToMarkers = (callback) => {
  const subscription = supabase
    .channel("realtime:markers")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "markers" },
      (payload) => {
        console.log("Change received!", payload);
        callback(); // Calls function to refetch data
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
