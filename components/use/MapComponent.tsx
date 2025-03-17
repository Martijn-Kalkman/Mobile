import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

const MapComponent = ({
  location,
  savedLocations,
  newMarker,
  setNewMarker,
  checkProximity,
  markerName,
}) => {
  return (
    <View style={{ width: "100%", height: "80%" }}>
      {location && (
        <MapView
          style={{ width: "100%", height: "100%" }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          onPress={(e) => {
            setNewMarker(e.nativeEvent.coordinate);
            checkProximity(e.nativeEvent.coordinate); // Check proximity when map is pressed
          }}
        >
          {savedLocations.map((item, index) => (
            <Marker key={index} coordinate={item} title={item.name} />
          ))}
          {newMarker && (
            <Marker
              coordinate={newMarker}
              title={markerName}
              description="New marker"
            />
          )}
        </MapView>
      )}
    </View>
  );
};

export default MapComponent;
