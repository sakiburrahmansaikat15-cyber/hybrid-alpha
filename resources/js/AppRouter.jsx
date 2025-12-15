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
import Vendor from "./pages/Dashboard/Vendor";
import SubCategories from "./pages/Dashboard/SubCategories";
import Subitems from "./pages/Dashboard/SubItems";
import Products from "./pages/Dashboard/Products";
import Variants from "./pages/Dashboard/Variants";
import Stocks from "./pages/Dashboard/Stocks";
import Transactions from "./pages/Dashboard/Transactions";
import SerialList from "./pages/Dashboard/SerialList";
import Employee from "./pages/Dashboard/HRM/Employee";
import Departments from "./pages/Dashboard/HRM/Departments";
import Designations from "./pages/Dashboard/HRM/Designations";
import EmployeeDocuments from "./pages/Dashboard/HRM/EmployeeDocuments";
import Attendance from "./pages/Dashboard/HRM/Attendance";
import Shifts from "./pages/Dashboard/HRM/Shifts";
import LeaveTypes from "./pages/Dashboard/HRM/LeaveTypes";
import LeaveApplications from "./pages/Dashboard/HRM/LeaveApplications";
import Salaries from "./pages/Dashboard/HRM/Salaries";
import Payroll from "./pages/Dashboard/HRM/Payroll";


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
                    <Route path="/Vendor" element={<Vendor />} />
                    <Route path="/SubCategories" element={<SubCategories />} />
                    <Route path="/Subitems" element={<Subitems/>} />
                    <Route path="/Products" element={<Products/>} />
                    <Route path="/Variants" element={<Variants/>} />
                    <Route path="/Stocks" element={<Stocks/>} />
                    <Route path="/Transactions" element={<Transactions/>} />
                   <Route path="/serial-list" element={<SerialList/>} />
                   <Route path="/employees" element={<Employee/>} />
                   <Route path="/departments" element={<Departments/>} />
                    <Route path="/designations" element={<Designations/>} />
                     <Route path="/employee_documents" element={<EmployeeDocuments/>} />
                     <Route path="/attendance" element={<Attendance/>} />
                      <Route path="/shifts" element={<Shifts/>} />
                      <Route path="/leave_types" element={<LeaveTypes/>} />
                       <Route path="/leave_applications" element={<LeaveApplications/>} />
                        <Route path="/salaries" element={<Salaries/>} />
                         <Route path="/payroll" element={<Payroll/>} />
                </Route>
            </Routes>
        </div>
    );
};

export default AppRouter;
