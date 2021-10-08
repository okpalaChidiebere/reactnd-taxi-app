import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useFormikContext } from "formik";

export default function LoginForm({ email, password, handleFormType }) {
  const {
    setFieldTouched,
    setFieldValue,
    errors,
    touched,
    isSubmitting,
    handleSubmit,
    values,
  } = useFormikContext();

  return (
    <View>
      <View>
        <TextInput
          style={[
            styles.input,
            {
              borderColor:
                touched[email] && errors[email] ? "#FF0D10" : "black",
            },
          ]}
          placeholder="your@email.com"
          placeholderTextColor="#fff"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={values[email]}
          onChangeText={(v) => setFieldValue(email, v)}
          onBlur={() => setFieldTouched(email, true)}
          editable={!isSubmitting}
        />
        {errors[email] && touched[email] && (
          <Text style={{ fontSize: 12, color: "#FF0D10" }}>
            {errors[email]}
          </Text>
        )}
      </View>
      <View>
        <TextInput
          style={[
            styles.input,
            {
              borderColor:
                touched[password] && errors[password] ? "#FF0D10" : "black",
            },
          ]}
          placeholder="********"
          placeholderTextColor="#fff"
          autoCapitalize="none" //we dont want auto capitalization of the password as the user is typing
          autoCorrect={false} //we dont want to auto-correct the user password being typed in
          secureTextEntry //we dont want to sure what the user is typing in
          value={values[password]}
          onChangeText={(v) => setFieldValue(password, v)}
          onBlur={() => setFieldTouched(password, true)}
          editable={!isSubmitting}
        />
        {errors[password] && touched[password] && (
          <Text style={{ fontSize: 12, color: "#FF0D10" }}>
            {errors[password]}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={async () => {
          handleFormType("SIGN_IN");
          handleSubmit();
        }}
        style={styles.button}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={async () => {
          handleFormType("SIGN_UP");
          handleSubmit();
        }}
        style={styles.button}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    padding: 10, //for padding on the text you write
    backgroundColor: "#8793A6",
    color: "#FFF",
    borderWidth: 1,
  },
  button: {
    backgroundColor: "#ABC837",
    paddingVertical: 20,
    marginVertical: 10,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 23,
    color: "#000", //for android, you have to explicity set the button color to be black. On iOS, it is black by default
    fontWeight: "200",
    fontFamily: Platform.OS === "android" ? "sans-serif-light" : undefined,
  },
});
