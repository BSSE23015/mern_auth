import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const {  setIsAuthenticated, user, setUser } =
    useContext(Context);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const handleLogin = async (data) => {
    await axios
      .post("http://localhost:4000/api/v1/login", data, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        toast.success(res.data.message);
        setIsAuthenticated(true);
        setUser(res.data.user);
        navigate("/");
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      });
  };
  return (
    <>
      <form
        className="auth-form"
        onSubmit={handleSubmit((data) => handleLogin(data))}
      >
        <h2>Login</h2>
        <h3>Enter Email</h3>
        <input
          placeholder="Email"
          type="email"
          required
          {...register("email", {
            required: "Email is required!",
          })}
        />
        <h3>Enter Password</h3>
        <input
          placeholder="Password"
          type="password"
          required
          {...register("password", {
            required: "Password is required!",
          })}
        />
        {errors.password && (
          <p style={{ color: "red" }}>{errors.password.message}</p>
        )}
        <p className="forgot-password">
          Forgot Password?
          <Link to={"/password/forgot"}>Click Here</Link>
        </p>
        <button type="submit">Login</button>
      </form>
    </>
  );
};

export default Login;
