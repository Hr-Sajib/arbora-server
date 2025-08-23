import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.routes";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CustomerRoutes } from "../modules/customer/customer.route";
import { OrderRoutes } from "../modules/order/order.route";
import { ContainerRoutes } from "../modules/container/container.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { ProductRoutes } from "../modules/product/product.routes";
import { ProspectRoutes } from "../modules/prospect/prospect.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/prospect",
    route: ProspectRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/customer",
    route: CustomerRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/order",
    route: OrderRoutes,
  },
  {
    path: "/container",
    route: ContainerRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
