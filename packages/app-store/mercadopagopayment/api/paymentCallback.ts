import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import z from "zod";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { defaultHandler, defaultResponder } from "@calcom/lib/server";
import { prisma } from "@calcom/prisma";

const request = require("sync-request");

const querySchema = z.object({
  callbackUrl: z.string().transform((url) => {
    if (url.search(/^https?:\/\//) === -1) {
      url = `${WEBAPP_URL}${url}`;
    }
    return new URL(url);
  }),
  checkoutSessionId: z.string(),
});

// It handles premium user payment success/failure
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.query);
  // &payment_id=1314202166&status=approved
  // &external_reference=null&payment_type=credit_card
  // &merchant_order_id=10867929622&preference_id=92582695-32855d2e-713c-4ac9-8fa9-54e735f902f8
  // &site_id=MLA&processing_mode=aggregator
  // &merchant_account_id=null
  // const { payment_id, merchant_order_id,preference_id,merchant_account_id } = querySchema.parse(req.query);
  // const { stripeCustomer, checkoutSession } = await getCustomerAndCheckoutSession(checkoutSessionId);

  // callbackUrl.searchParams.set("paymentStatus", checkoutSession.payment_status);
  // return res.redirect(callbackUrl.toString()).end();
  console.log(req.query);
  const payment = await prisma.payment.findFirst({
    where: {
      uid: req.query.external_reference,
    },
  });
  const token = payment.data.access_token; // Replace this with your actual Bearer token
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json", // Optional, set any additional headers if required
  };

  const options = {
    headers,
  };

  const response = request("GET", "https://api.mercadopago.com/v1/payments/" + req.query.payment_id, options); // Replace the URL with your actual API endpoint
  const data = JSON.parse(response.getBody("utf8"));
  const updatedPayment = await prisma.payment.update({
    where: {
      uid: req.query.external_reference,
    },
    data: {
      uid: uuidv4(),
      amount: data.transaction_details.total_paid_amount,
      fee: data.transaction_details.net_received_amount,
      currency: "ars",
      success: data.status == "approved",
      refunded: data.status == "refunded",
      data: data,
      externalId: req.query.payment_id,
    },
  });
  console.log(updatedPayment, "pagoUpdt");
  const booking = await prisma.booking.findFirst({
    where: {
      id: updatedPayment.bookingId,
    },
  });
  console.log(booking);
  const event = await prisma.eventType.findFirst({
    where: {
      id: booking.eventTypeId,
    },
  });
  const callbackUrl =
    WEBAPP_URL +
    "/booking/" +
    booking.uid +
    "?isSuccessBookingPage=true&email=" +
    booking.responses.email +
    "&eventTypeSlug=" +
    event.slug +
    "&seatReferenceUid=";

  return res.redirect(callbackUrl.toString()).end();
}

export default defaultHandler({
  GET: Promise.resolve({ default: defaultResponder(getHandler) }),
});
