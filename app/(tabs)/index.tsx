import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Modal,
  TextInput,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapScreen from "../../components/use/MapScreen";
import LocationPermissions from "../../components/use/LocationPermissions";
import {
  fetchMarkersFromSupabase,
  saveMarkerToSupabase,
  subscribeToMarkers,
} from "../../utils/supabaseClient"; // Import functions

const HomeScreen = () => {
  const [location, setLocation] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [newMarker, setNewMarker] = useState(null);
  const [markerName, setMarkerName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch saved locations from AsyncStorage and Supabase
  const loadSavedLocations = useCallback(async () => {
    try {
      const locations = await AsyncStorage.getItem("savedLocations");
      if (locations) {
        setSavedLocations(JSON.parse(locations));
      }

      const supabaseLocations = await fetchMarkersFromSupabase();
      setSavedLocations((prevLocations) => [
        ...prevLocations,
        ...supabaseLocations,
      ]);
    } catch (error) {
      console.error("Failed to load saved locations:", error);
    }
  }, []);

  useEffect(() => {
    loadSavedLocations(); // Load saved locations initially

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMarkers(loadSavedLocations);

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [loadSavedLocations]);

  const saveMarker = async () => {
    if (!newMarker) {
      Alert.alert("Error", "Please tap on the map to place a marker.");
      return;
    }
    if (!markerName.trim()) {
      Alert.alert("Error", "Please enter a name for the marker.");
      return;
    }
    try {
      const newMarkerData = {
        latitude: newMarker.latitude,
        longitude: newMarker.longitude,
        name: markerName,
      };

      // Save to local storage
      const storedMarkers = await AsyncStorage.getItem("savedLocations");
      const markers = storedMarkers ? JSON.parse(storedMarkers) : [];
      markers.push(newMarkerData);
      await AsyncStorage.setItem("savedLocations", JSON.stringify(markers));
      setSavedLocations(markers);

      // Save to Supabase
      const success = await saveMarkerToSupabase(newMarkerData);
      if (success) {
        setNewMarker(null);
        setMarkerName("");
        setModalVisible(false); // Close the modal after saving
      }
    } catch (error) {
      console.error("Failed to save marker:", error);
    }
  };

  const handleMapPress = (e) => {
    const tappedLocation = e.nativeEvent.coordinate;
    setNewMarker(tappedLocation);
    setModalVisible(true); // Show the modal when a location is tapped
  };

  return (
    <View style={styles.container}>
      <LocationPermissions />
      <Text style={styles.text}>Tap on the map to add a marker</Text>

      {/* Modal to input marker name */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Marker Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Marker name"
              value={markerName}
              onChangeText={setMarkerName}
            />
            <Button title="Save Marker" onPress={saveMarker} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <MapScreen
        location={newMarker}
        savedLocations={savedLocations}
        setNewMarker={setNewMarker}
        handleMapPress={handleMapPress} // Pass the function to handle map press
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { margin: 10, fontSize: 18, fontWeight: "bold" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
});

export default HomeScreen;
