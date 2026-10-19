import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import DashboardPage from "./pages/DashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="producto/:id" element={<ProductDetailPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="pedidos"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="panel"
          element={
            <ProtectedRoute roles={["ADMIN", "GESTOR"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/usuarios"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
