import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Mercadopago",
  description: _package.description,
  installed: !!(
    process.env.STRIPE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY &&
    process.env.STRIPE_PRIVATE_KEY
  ),
  slug: "mercadopagopayment",
  category: "payment",
  categories: ["payment"],
  logo: "icon.svg",
  publisher: "@adanjz",
  title: "Mercadopago",
  type: "mercadopagopayment",
  url: "https://mercadopago.com",
  docsUrl: "https://mercadopago.com/docs",
  variant: "payment",
  extendsFeature: "EventType",
  email: "help@mercadopago.com",
  dirName: "mercadopagopayment",
} as AppMeta;

export default metadata;
