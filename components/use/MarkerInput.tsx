import React from "react";
import { TextInput, StyleSheet } from "react-native";

const MarkerInput = ({ markerName, setMarkerName }) => {
  return (
    <TextInput
      style={styles.input}
      placeholder="Enter marker name"
      value={markerName}
      onChangeText={setMarkerName}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: "80%",
    padding: 10,
    margin: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    fontSize: 16,
  },
});

export default MarkerInput;
