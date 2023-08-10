import { stringify } from "querystring";
import request from "sync-request";

import { WEBSITE_URL } from "@calcom/lib/constants";

// const request = require("sync-request");

export type Maybe<T> = T | undefined | null;

export function createPaymentLink(opts: {
  paymentUid: string;
  name?: Maybe<string>;
  date?: Maybe<string>;
  email?: Maybe<string>;
  event?: Maybe<object>;
  paymentData?: Maybe<object>;
  absolute?: boolean;
}): string {
  console.log(opts);
  const { paymentUid, name, email, date, absolute = true, event, paymentData } = opts;
  let link = "";
  if (absolute) link = WEBSITE_URL;

  const query = stringify({ date, name, email });
  console.log("linkExpected", link2);
  // return reqst.data.init_point;

  return link + `/payment/${paymentUid}?${query}`;
}
