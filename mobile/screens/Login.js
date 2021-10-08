import React from "react";
import { View, StyleSheet, Text, Platform, Alert, Image } from "react-native";
import { Formik } from "formik"; //https://github.com/formium/formik/discussions/2535
import LoginForm from "../components/LoginForm";
import * as yup from "yup";
import { loginUser, signUp } from "../NetworkUtils";

export default function Login({ handleSetToken }) {
  const [errorMsg, setErrorMsg] = React.useState("");
  const [formType, setFormType] = React.useState();

  const handleSetFormSubmitting = (type) => {
    setFormType(type);
  };

  const formValues = {
    email: "",
    password: "",
  };

  const handleOnAuthSuccess = (token) => {
    Alert.alert(JSON.stringify(token));
    setErrorMsg("");
    handleSetToken("token", token);
  };

  const passwordRegExr = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{5,}$/;
  const LoginFormValidation = yup.object().shape({
    //We describe the shape of our data using the keys that map to the keys on our form initialValues
    email: yup.string().required().email().label("Email"),
    password: yup
      .string()
      .matches(passwordRegExr, "Password too weak")
      .required()
      .min(5)
      .label("Password"),
  });

  const handleFormSubmit = async (values, { setSubmitting, setFieldError }) => {
    let result;
    setSubmitting(true);
    try {
      switch (formType) {
        case "SIGN_IN":
          result = await loginUser(values.email, values.password);
          break;
        case "SIGN_UP":
          await signUp(values.email, values.password);
          result = await loginUser(values.email, values.password);
          break;
      }
    } catch (e) {
      setErrorMsg(e.message);
      //setFieldError("password", "yesss"); //you can set the return error to a specific field if you want
      //console.log("Error", e.message);
    } finally {
      setSubmitting(false);
      if (result?.token) handleOnAuthSuccess(result.token);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>React Native Taxi</Text>
      <Formik
        initialValues={formValues}
        onSubmit={handleFormSubmit}
        validationSchema={LoginFormValidation}
      >
        {() => (
          <LoginForm
            /* NOTE: You want the value of the props to match the keys for the format initial values */
            email="email"
            password="password"
            handleFormType={handleSetFormSubmitting}
          />
        )}
      </Formik>
      <Text style={styles.errorMessage}>{errorMsg}</Text>
      <Image source={require("../images/greencar.png")} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3A3743",
  },
  headerText: {
    fontSize: 44,
    textAlign: "center",
    color: "#C1D76D",
    marginTop: 30,
    fontWeight: "200",
    fontFamily: Platform.OS === "android" ? "sans-serif-light" : undefined, //for Android, this will server thesame purpose as fontWeight because the fontWeight property dont work as much in android
  },
  errorMessage: {
    marginHorizontal: 10,
    fontSize: 18,
    color: "#F5D7CC",
    fontWeight: "bold",
  },
  logo: {
    height: 300,
    width: 300,
    alignSelf: "center",
  },
});
