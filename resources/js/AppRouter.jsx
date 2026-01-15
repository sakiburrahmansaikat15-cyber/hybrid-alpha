import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./hooks/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#030712] text-cyan-500">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      <div className="mt-4 text-xs font-mono uppercase tracking-widest animate-pulse">Initializing Interface...</div>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isInitialized } = useAuth();

  if (!isInitialized || loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Lazy loaded components
const Login = lazy(() => import("./pages/Auth/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const AIAnalytics = lazy(() => import("./pages/Dashboard/AIAnalytics"));

const Users = lazy(() => import("./pages/Dashboard/Users"));
const Roles = lazy(() => import("./pages/Dashboard/Roles"));
const Units = lazy(() => import("./pages/Dashboard/Units"));
const Categories = lazy(() => import("./pages/Dashboard/Categories"));
const ProductType = lazy(() => import("./pages/Dashboard/ProductType"));
const Brands = lazy(() => import("./pages/Dashboard/Brands"));
const PaymentTypes = lazy(() => import("./pages/Dashboard/PaymentTypes"));
const Warehouses = lazy(() => import("./pages/Dashboard/Warehouses"));
const Vendor = lazy(() => import("./pages/Dashboard/Vendor"));
const SubCategories = lazy(() => import("./pages/Dashboard/SubCategories"));
const Subitems = lazy(() => import("./pages/Dashboard/SubItems"));
const Products = lazy(() => import("./pages/Dashboard/Products"));
const Variants = lazy(() => import("./pages/Dashboard/Variants"));
const Stocks = lazy(() => import("./pages/Dashboard/Stocks"));
const Transactions = lazy(() => import("./pages/Dashboard/Transactions"));
const SerialList = lazy(() => import("./pages/Dashboard/SerialList"));

// HRM
const HrmDashboard = lazy(() => import("./pages/Dashboard/HRM/HrmDashboard"));
const Employee = lazy(() => import("./pages/Dashboard/HRM/Employee"));
const Departments = lazy(() => import("./pages/Dashboard/HRM/Departments"));
const Designations = lazy(() => import("./pages/Dashboard/HRM/Designations"));
const EmployeeDocuments = lazy(() => import("./pages/Dashboard/HRM/EmployeeDocuments"));
const Attendance = lazy(() => import("./pages/Dashboard/HRM/Attendance"));
const Shifts = lazy(() => import("./pages/Dashboard/HRM/Shifts"));
const LeaveTypes = lazy(() => import("./pages/Dashboard/HRM/LeaveTypes"));
const LeaveApplications = lazy(() => import("./pages/Dashboard/HRM/LeaveApplications"));
const Salaries = lazy(() => import("./pages/Dashboard/HRM/Salaries"));
const Payroll = lazy(() => import("./pages/Dashboard/HRM/Payroll"));

// CRM
const CrmDashboard = lazy(() => import("./pages/Dashboard/CRM/Dashboard"));
const Lead = lazy(() => import("./pages/Dashboard/CRM/Lead"));
const LeadSource = lazy(() => import("./pages/Dashboard/CRM/LeadSource"));
const LeadStatus = lazy(() => import("./pages/Dashboard/CRM/LeadStatus"));
const Customer = lazy(() => import("./pages/Dashboard/CRM/Customer"));
const Company = lazy(() => import("./pages/Dashboard/CRM/Company"));
const Contact = lazy(() => import("./pages/Dashboard/CRM/Contact"));
const Opportunity = lazy(() => import("./pages/Dashboard/CRM/Opportunity"));
const OpportunityStage = lazy(() => import("./pages/Dashboard/CRM/OpportunityStage"));
const Activity = lazy(() => import("./pages/Dashboard/CRM/Activity"));
const Campaign = lazy(() => import("./pages/Dashboard/CRM/Campaign"));
const Ticket = lazy(() => import("./pages/Dashboard/CRM/Ticket"));

// POS
const PosTerminals = lazy(() => import("./pages/Dashboard/POS/PosTerminals"));
const CustomerAddresses = lazy(() => import("./pages/Dashboard/POS/CustomerAddresses"));
const CustomerGroups = lazy(() => import("./pages/Dashboard/POS/CustomerGroups"));
const Customers = lazy(() => import("./pages/Dashboard/POS/Customers"));
const GiftCards = lazy(() => import("./pages/Dashboard/POS/GiftCards"));
const HoldCarts = lazy(() => import("./pages/Dashboard/POS/HoldCarts"));
const PaymentGateways = lazy(() => import("./pages/Dashboard/POS/PaymentGateways"));
const PaymentMethods = lazy(() => import("./pages/Dashboard/POS/PaymentMethods"));
const PosSessions = lazy(() => import("./pages/Dashboard/POS/PosSessions"));
const Receipts = lazy(() => import("./pages/Dashboard/POS/Receipts"));
const ReceiptTemplates = lazy(() => import("./pages/Dashboard/POS/ReceiptTemplates"));
const SaleDiscounts = lazy(() => import("./pages/Dashboard/POS/SaleDiscounts"));
const SaleItems = lazy(() => import("./pages/Dashboard/POS/SaleItems"));
const SalePayments = lazy(() => import("./pages/Dashboard/POS/SalePayments"));
const Sales = lazy(() => import("./pages/Dashboard/POS/Sales"));
const SaleTaxes = lazy(() => import("./pages/Dashboard/POS/SaleTaxes"));
const TaxGroups = lazy(() => import("./pages/Dashboard/POS/TaxGroups"));
const TaxRates = lazy(() => import("./pages/Dashboard/POS/TaxRates"));
const Vouchers = lazy(() => import("./pages/Dashboard/POS/Vouchers"));
const Checkout = lazy(() => import("./pages/Dashboard/POS/Checkout"));

// Accounting
const AuditLogs = lazy(() => import("./pages/Dashboard/AuditLogs"));
const AccountingDashboard = lazy(() => import("./pages/Dashboard/Accounting/AccountingDashboard"));
const ChartOfAccounts = lazy(() => import("./pages/Dashboard/Accounting/ChartOfAccounts"));
const JournalEntries = lazy(() => import("./pages/Dashboard/Accounting/JournalEntries"));
const Reports = lazy(() => import("./pages/Dashboard/Accounting/Reports/Reports"));
const BalanceSheet = lazy(() => import("./pages/Dashboard/Accounting/Reports/BalanceSheet"));
const IncomeStatement = lazy(() => import("./pages/Dashboard/Accounting/Reports/IncomeStatement"));
const TrialBalance = lazy(() => import("./pages/Dashboard/Accounting/Reports/TrialBalance"));
const AgedReport = lazy(() => import("./pages/Dashboard/Accounting/Reports/AgedReport"));
const CashFlowStatement = lazy(() => import("./pages/Dashboard/Accounting/Reports/CashFlowStatement"));
const Invoices = lazy(() => import("./pages/Dashboard/Accounting/Invoices"));
const Bills = lazy(() => import("./pages/Dashboard/Accounting/Bills"));
const Budgets = lazy(() => import("./pages/Dashboard/Accounting/Budgets"));

// Settings
const GeneralSettings = lazy(() => import("./pages/Dashboard/Settings/GeneralSettings"));
const InventoryConfig = lazy(() => import("./pages/Dashboard/Settings/InventoryConfig"));
const CrmConfig = lazy(() => import("./pages/Dashboard/Settings/CrmConfig"));
const PosConfig = lazy(() => import("./pages/Dashboard/Settings/PosConfig"));
const HrConfig = lazy(() => import("./pages/Dashboard/Settings/HrConfig"));


const AppRouter = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="/analytics" element={<AIAnalytics />} />

              <Route path="/users" element={<Users />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/units" element={<Units />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/ProductType" element={<ProductType />} />
              <Route path="/Brands" element={<Brands />} />
              <Route path="/PaymentTypes" element={<PaymentTypes />} />
              <Route path="/Warehouses" element={<Warehouses />} />
              <Route path="/Vendor" element={<Vendor />} />
              <Route path="/SubCategories" element={<SubCategories />} />
              <Route path="/Subitems" element={<Subitems />} />
              <Route path="/Products" element={<Products />} />
              <Route path="/Variants" element={<Variants />} />
              <Route path="/Stocks" element={<Stocks />} />
              <Route path="/Transactions" element={<Transactions />} />
              <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
              <Route path="/settings/general" element={<GeneralSettings />} />

              <Route path="/inventory-setup" element={<InventoryConfig />} />
              <Route path="/crm-setup" element={<CrmConfig />} />
              <Route path="/pos-setup" element={<PosConfig />} />
              <Route path="/hr-setup" element={<HrConfig />} />
              <Route path="/accounting/dashboard" element={<AccountingDashboard />} />
              <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/accounting/journals" element={<JournalEntries />} />
              <Route path="/accounting/invoices" element={<Invoices />} />
              <Route path="/accounting/bills" element={<Bills />} />
              <Route path="/accounting/budgets" element={<Budgets />} />
              <Route path="/accounting/reports" element={<Reports />} />
              <Route path="/accounting/components/BalanceSheet" element={<BalanceSheet />} />
              <Route path="/accounting/components/IncomeStatement" element={<IncomeStatement />} />
              <Route path="/accounting/components/TrialBalance" element={<TrialBalance />} />
              <Route path="/accounting/reports/aged-payables" element={<AgedReport type="payable" />} />
              <Route path="/accounting/reports/aged-receivables" element={<AgedReport type="receivable" />} />
              <Route path="/accounting/reports/cash-flow" element={<CashFlowStatement />} />
              <Route path="/serial-list" element={<SerialList />} />
              <Route path="/hrm/dashboard" element={<HrmDashboard />} />
              <Route path="/employees" element={<Employee />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/designations" element={<Designations />} />
              <Route path="/employee_documents" element={<EmployeeDocuments />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/shifts" element={<Shifts />} />
              <Route path="/leave_types" element={<LeaveTypes />} />
              <Route path="/leave_applications" element={<LeaveApplications />} />
              <Route path="/salaries" element={<Salaries />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/crm/dashboard" element={<CrmDashboard />} />
              <Route path="/lead" element={<Lead />} />
              <Route path="/lead-source" element={<LeadSource />} />
              <Route path="/lead-status" element={<LeadStatus />} />
              <Route path="/customer" element={<Customer />} />
              <Route path="/company" element={<Company />} />
              <Route path="/Contact" element={<Contact />} />
              <Route path="/opportunity" element={<Opportunity />} />
              <Route path="/opportunity-stage" element={<OpportunityStage />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/campaign" element={<Campaign />} />
              <Route path="/ticket" element={<Ticket />} />
              <Route path="/pos-terminals" element={<PosTerminals />} />
              <Route path="/customer-addresses" element={<CustomerAddresses />} />
              <Route path="/customer-groups" element={<CustomerGroups />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/gift-cards" element={<GiftCards />} />
              <Route path="/hold-carts" element={<HoldCarts />} />
              <Route path="/payment-gateways" element={<PaymentGateways />} />
              <Route path="/Payment-Methods" element={<PaymentMethods />} />
              <Route path="/pos-sessions" element={<PosSessions />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/receipt-templates" element={<ReceiptTemplates />} />
              <Route path="/sale-discounts" element={<SaleDiscounts />} />
              <Route path="/sale-items" element={<SaleItems />} />
              <Route path="/sale-payments" element={<SalePayments />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sale-taxes" element={<SaleTaxes />} />
              <Route path="/tax-groups" element={<TaxGroups />} />
              <Route path="/tax-rates" element={<TaxRates />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default AppRouter;
