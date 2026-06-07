import type { Product } from "#/api/Products";
import { Brand } from "#/components/brand/brand";
import { getRouteApi, Link, useRouterState } from "@tanstack/react-router";
import { Beaker, Package, Scale } from "lucide-react";
import { NavLink } from "../ui/nav-link";
import { NavLinkIcon } from "../ui/nav-link-icon";

const productRouteApi = getRouteApi("/products/$productId");

export const ProductSidebar = ({ product }: { product: Product }) => {
  const route = productRouteApi.useMatch();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = pathname.substring(pathname.lastIndexOf("/") + 1);

  return (
    <div>
      <Link to="/brands/$brandId" params={{ brandId: product.brand.id.toString() }}>
        <Brand brand={product.brand} />
      </Link>

      <br />
      <NavLink asChild variant={page === product.id ? "active" : "inactive"}>
        <Link from={route.fullPath} to=".">
          <NavLinkIcon variant={page === product.id ? "active" : "inactive"}>
            <Package />
          </NavLinkIcon>
          <span>Product Overview</span>
        </Link>
      </NavLink>
      <NavLink asChild variant={page === `additives` ? "active" : "inactive"}>
        <Link from={route.fullPath} to="./additives">
          <NavLinkIcon variant={page === `additives` ? "active" : "inactive"}>
            <Beaker />
          </NavLinkIcon>
          <span>Additives</span>
        </Link>
      </NavLink>
      <NavLink asChild variant={page === `nutrition` ? "active" : "inactive"}>
        <Link from={route.fullPath} to="./nutrition">
          <NavLinkIcon variant={page === `nutrition` ? "active" : "inactive"}>
            <Scale />
          </NavLinkIcon>
          <span>Nutrition</span>
        </Link>
      </NavLink>
    </div>
  );
};

// const navItems: NavItem[] = [
//   { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { to: "/products1", label: "Products", icon: Package },
//   { to: "/raw-materials", label: "Raw Materials", icon: Boxes },
//   { to: "/additives", label: "Food Additives", icon: Beaker },
//   { to: "/flavourings", label: "Flavourings", icon: FlaskConical },
//   { to: "/allergens", label: "Allergens", icon: SearchCheck },
//   { to: "/ingredients-claims", label: "Ingredient Claims", icon: SearchCheck },
//   { to: "/lab-average", label: "Lab Average", icon: TestTube2 },
//   { to: "/nutrition", label: "Nutrition", icon: Scale },
//   { to: "/labeling", label: "Labeling", icon: BookOpenText },
//   { to: "/packaging", label: "Packaging", icon: ClipboardCheck },
//   { to: "/process-haccp", label: "Process HACCP", icon: ShieldCheck },
// ];
