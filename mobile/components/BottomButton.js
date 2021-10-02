import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";

export default function BottomButton({
  buttonText,
  onPressFunction,
  children,
}) {
  return (
    <View style={styles.bottomButton}>
      <TouchableOpacity onPress={() => onPressFunction()}>
        <View>
          <Text style={styles.bottomButtonText}>{buttonText}</Text>
          {children}
        </View>
      </TouchableOpacity>
    </View>
  );
}

BottomButton.propTypes = {
  onPressFunction: PropTypes.func,
  buttonText: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  bottomButton: {
    backgroundColor: "black",
    marginTop: "auto", //moves the button down to the bottom. Another way is to use the absolute property and bottom of zero value
    margin: 20,
    padding: 15,
    paddingLeft: 30,
    paddingRight: 30,
    alignSelf: "center",
  },
  bottomButtonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
  },
});
