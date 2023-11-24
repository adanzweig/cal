import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";

import { getEventName } from "@calcom/core/event";
import { sendScheduledEmails } from "@calcom/emails";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { defaultHandler, defaultResponder } from "@calcom/lib/server";
import { getTranslation } from "@calcom/lib/server/i18n";
import { TimeFormat } from "@calcom/lib/timeFormat";
import { prisma } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { CalendarEvent } from "@calcom/types/Calendar";

import type { EventTypeInfo } from "../../webhooks/lib/sendPayload";

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
  const payment = await prisma.payment.findFirst({
    where: {
      uid: req.query.external_reference,
    },
  });
  console.log(payment);
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
      amount: data.transaction_details.total_paid_amount,
      fee: data.transaction_details.net_received_amount,
      currency: "ars",
      success: data.status == "approved",
      refunded: data.status == "refunded",
      data: data,
      externalId: req.query.payment_id,
    },
  });

  const updatedBooking = await prisma.booking.update({
    where: {
      id: payment.bookingId,
    },
    data: {
      paid: data.status == "approved",
      status: data.status == "approved" ? BookingStatus.ACCEPTED : BookingStatus.PENDING,
    },
  });
  console.log(payment, "pagoUpdt");
  const booking = await prisma.booking.findFirst({
    where: {
      id: payment.bookingId,
    },
  });
  console.log(booking);
  const eventType = await prisma.eventType.findFirst({
    where: {
      id: booking.eventTypeId,
    },
  });
  const organizerUser = await prisma.user.findFirst({
    where: {
      id: booking.userId,
    },
  });

  const callbackUrl =
    WEBAPP_URL +
    "/booking/" +
    booking.uid +
    "?isSuccessBookingPage=true&email=" +
    booking.responses.email +
    "&eventTypeSlug=" +
    eventType.slug +
    "&seatReferenceUid=";

  const tOrganizer = await getTranslation(organizerUser?.locale ?? "en", "common");

  const eventNameObject = {
    //TODO: Can we have an unnamed attendee? If not, I would really like to throw an error here.
    attendeeName: booking.responses.name,
    eventType: eventType.title,
    eventName: eventType.eventName,
    // TODO: Can we have an unnamed organizer? If not, I would really like to throw an error here.
    host: organizerUser.name || "Nameless",
    location: booking.location,
    bookingFields: booking.responses,
    t: tOrganizer,
  };
  const tAttendees = await getTranslation("en");

  const invitee = [
    {
      email: booking.responses.email,
      name: booking?.responses.name,
      timeZone: organizerUser.timeZone,
      language: { translate: tAttendees, locale: "en" },
    },
  ];

  const attendeesList = [...invitee];
  const requiresConfirmation = false;
  const evt: CalendarEvent = {
    uid: booking.uid,
    type: eventType.title,
    title: getEventName(eventNameObject), //this needs to be either forced in english, or fetched for each attendee and organizer separately
    description: eventType.description,
    additionalNotes: "",
    customInputs: booking.customInputs,
    startTime: booking?.startTime,
    endTime: booking?.endTime,
    organizer: {
      id: organizerUser.id,
      name: organizerUser.name || "Nameless",
      email: organizerUser.email || "Email-less",
      username: organizerUser.username || undefined,
      timeZone: organizerUser.timeZone,
      language: { translate: tAttendees, locale: organizerUser.locale ?? "en" },
      timeFormat: organizerUser.timeFormat === 24 ? TimeFormat.TWENTY_FOUR_HOUR : TimeFormat.TWELVE_HOUR,
    },
    responses: booking.responses,
    userFieldsResponses: booking.responses,
    attendees: attendeesList,
    location: booking.location, // Will be processed by the EventManager later.
    /** For team events & dynamic collective events, we will need to handle each member destinationCalendar eventually */
    destinationCalendar: eventType.destinationCalendar || organizerUser.destinationCalendar,
    hideCalendarNotes: eventType.hideCalendarNotes,
    requiresConfirmation: false,
    eventTypeId: eventType.id,
    // if seats are not enabled we should default true
    seatsShowAttendees: eventType.seatsPerTimeSlot ? eventType.seatsShowAttendees : true,
    seatsPerTimeSlot: eventType.seatsPerTimeSlot,
    videoCallData: { url: booking?.metadata.videoCallUrl },
    additionalInformation: {},
  };

  const eventTypeInfo: EventTypeInfo = {
    eventTitle: eventType.title,
    eventDescription: eventType.description,
    requiresConfirmation: requiresConfirmation || null,
    price: payment?.amount,
    currency: eventType.currency,
    length: eventType.length,
  };
  const isHostConfirmationEmailsDisabled = false;
  const isAttendeeConfirmationEmailDisabled = false;
  console.log(eventNameObject);
  await sendScheduledEmails(
    evt,
    eventNameObject,
    isHostConfirmationEmailsDisabled,
    isAttendeeConfirmationEmailDisabled
  );

  return res.redirect(callbackUrl.toString()).end();
}

export default defaultHandler({
  GET: Promise.resolve({ default: defaultResponder(getHandler) }),
});
