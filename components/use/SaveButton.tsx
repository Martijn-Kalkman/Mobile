import React from "react";
import { Button } from "react-native";

const SaveButton = ({ saveMarker }) => {
  return <Button title="Save Marker" onPress={saveMarker} />;
};

export default SaveButton;
