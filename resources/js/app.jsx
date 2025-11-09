import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./AppRouter";
import "./index.css";
import { Provider } from "react-redux";
import ThemeProvider from "./components/Layout/ThemeProvider";
import store from "./store/store";

const root = createRoot(document.getElementById("app"));
root.render(
    <Provider store={store}>
        <ThemeProvider>
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </ThemeProvider>
    </Provider>
);
