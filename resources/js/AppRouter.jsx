import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Users from "./pages/Dashboard/Users";
import Layout from "./components/Layout";
import Roles from "./pages/Dashboard/Roles";

const AppRouter = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/users/all" element={<Users />} />
                    <Route path="/roles" element={<Roles />} />
                </Route>
            </Routes>
        </div>
    );
};

export default AppRouter;
