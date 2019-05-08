import React, { useState } from "react";
import "./Auth.scss";
import Banner from "./Banner";
import { Link } from "react-router-dom";
import { handleLogIn, authCheck } from "../services/auth-service";
import { Formik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import ForgotPasswordModal from "./ForgotPasswordModal.js";
import { useAlert } from "react-alert";

const Login = () => {
  const recaptchaRef = React.createRef();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [failures, setFailures] = useState(0);
  const [captchaMessage, setCaptchaMessage] = useState("");
  const alert = useAlert();

  const onCaptchaChange = value => {
    if (value) {
      setCaptchaMessage("");
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <main>
      <Banner
        titleUpper="Connect With"
        titleLower={"Job-Seekers"}
        imageName="homeless_poster"
      />
      <div className="login-form-container">
        <h2 id="login-title">Log In</h2>
        <Formik
          initialValues={{ email: "", password: "" }}
          validate={values => {
            let errors = {};
            if (!values.email) {
              errors.email = "Required";
            } else if (
              !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
            ) {
              errors.email = "Invalid email address";
            }

            if (!values.password) {
              errors.password = "Required";
            }
            if (failures >= 3) {
              const recaptchaValue = recaptchaRef.current.getValue();
              if (!recaptchaValue) {
                setCaptchaMessage("Captcha is required");
              }
            }
            return errors;
          }}
          validateOnChange="false"
          validateOnBlur="false"
          onSubmit={(values, { setSubmitting }) => {
            const { email, password } = values;
            handleLogIn(email, password).then(result => {
              if (
                result === "Invalid Credentials" ||
                result === "You must confirm your email before logging in"
              ) {
                alert.error(result);
                setFailures(failures + 1);
                setSubmitting(false);
              } else {
                window.location.href = "/";
                setSubmitting(false);
              }
            });
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting
          }) => (
            <form
              onSubmit={handleSubmit}
              name="login-form"
              aria-labelledby="login"
            >
              <div className="form-component">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <br />
                <input
                  id="email"
                  name="email"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                  className={
                    errors.email && touched.email
                      ? "error login-input"
                      : "login-input"
                  }
                />
                {errors.email && touched.email && (
                  <div className="input-feedback">{errors.email}</div>
                )}
                <br />
              </div>
              <div className="form-component">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <br />
                <input
                  type="password"
                  id="password"
                  name="password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.password}
                  className={
                    errors.password && touched.password
                      ? "error login-input"
                      : "login-input"
                  }
                />
                {errors.password && touched.password && (
                  <div className="input-feedback">{errors.password}</div>
                )}
                <br />
              </div>
              {failures >= 3 ? (
                <div>
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    onChange={onCaptchaChange}
                  />
                  <div className="input-feedback">{captchaMessage}</div>
                </div>
              ) : null}
              <button id="send-btn" type="submit" disabled={isSubmitting}>
                Submit
              </button>
              <span className="intext-link" onClick={openModal}>
                Forgot Password?
              </span>
            </form>
          )}
        </Formik>
        <ForgotPasswordModal
          modalIsOpen={modalIsOpen}
          closeModal={closeModal}
        />
        <div className="register-text">
          {"New to the site? Click "}
          <Link to="/register" className="intext-link">
            here
          </Link>{" "}
          to register
        </div>
      </div>
    </main>
  );
};

export default Login;
