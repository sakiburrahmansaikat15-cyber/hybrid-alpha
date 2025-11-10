import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Users from "./pages/Dashboard/Users";
import Layout from "./components/Layout";
import Roles from "./pages/Dashboard/Roles";
import Units from "./pages/Dashboard/units";
import Categories from "./pages/Dashboard/Categories";
import ProductType from "./pages/Dashboard/ProductType";
import Brands from "./pages/Dashboard/Brands";
import PaymentTypes from "./pages/Dashboard/PaymentTypes";
import Warehouses from "./pages/Dashboard/Warehouses";
const AppRouter = () => {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/users/all" element={<Users />} />
                    <Route path="/roles" element={<Roles />} />
                    <Route path="/units" element={<Units />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/ProductType" element={<ProductType />} />
                    <Route path="/Brands" element={<Brands />} />
                    <Route path="/PaymentTypes" element={<PaymentTypes />} />
                    <Route path="/Warehouses" element={<Warehouses />} />
                   
                </Route>
            </Routes>
        </div>
    );
};

export default AppRouter;
