import { post } from "@calcom/lib/fetch-wrapper";

import type { BookingCreateBody, BookingResponse } from "../types";

export const createBooking = async (data: BookingCreateBody) => {
  const response = await post<BookingCreateBody, BookingResponse>("/api/book/event", data);
  return response;
};

export const getMercadopagoLinkButton = async (data: BookingCreateBody) => {
  // const response = await post<BookingCreateBody, BookingResponse>("/api/book/mercadopagoPaymentLink", data);
  // return response;
  return "TESTING 123";
};
