const BASE_URL = "http://127.0.0.1:4000";

const defaultHeaders = {
  //"Content-Type": "x-www-form-urlencoded", //for some reason, this does not work in RN https://stackoverflow.com/questions/34570193/react-native-post-request-via-fetch-throws-network-request-failed
  Accept: "application/json",
  "Content-Type": "application/json", //a must have for fetch POST requests to work in RN
};

export const loginUser = async (email, password) => {
  const data = { email, password };

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "post",
    headers: defaultHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    //const message = `An error has occured: ${response.status}`;
    const errorText = await response.text();
    throw new Error(errorText);
    //console.log(response.status, text);
  }
  const result = await response.json();
  return result;
};

export const signUp = async (email, password) => {
  const data = { email, password };

  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "post",
    headers: defaultHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  const result = await response.json();
  return result;
};

//More on Fetch Requests
// https://dmitripavlutin.com/javascript-fetch-async-await/
// https://stackoverflow.com/questions/61116450/what-is-causing-an-unhandled-promise-rejection-undefined-is-not-an-object-eval
