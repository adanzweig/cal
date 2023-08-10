import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

import getInstalledAppPath from "../../_utils/getInstalledAppPath";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("TESTING TESTING 123");
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: "You must be logged in to do this" });
  }
  const appType = "mercadopagopayment";
  try {
    const alreadyInstalled = await prisma.credential.findFirst({
      where: {
        type: appType,
        userId: req.session.user.id,
      },
    });
    if (alreadyInstalled) {
      throw new Error("Already installed");
    }
    const installation = await prisma.credential.create({
      data: {
        type: appType,
        key: {},
        userId: req.session.user.id,
        appId: "mercadopagopayment",
      },
    });
    if (!installation) {
      throw new Error("Unable to create user credential for mercadopagopayment");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500);
  }
  return res
    .status(200)
    .json({ url: getInstalledAppPath({ variant: "payment", slug: "mercadopagopayment" }) });
}
