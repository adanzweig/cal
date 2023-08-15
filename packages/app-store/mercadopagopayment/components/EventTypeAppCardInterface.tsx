import { useRouter } from "next/router";
import { useState } from "react";

import { useAppContextWithSchema } from "@calcom/app-store/EventTypeAppContext";
import AppCard from "@calcom/app-store/_components/AppCard";
import type { EventTypeAppCardComponent } from "@calcom/app-store/types";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Alert, TextField, Select } from "@calcom/ui";

import { paymentOptions } from "../lib/constants";
import type { appDataSchema } from "../zod";

type Option = { value: string; label: string };

const EventTypeAppCard: EventTypeAppCardComponent = function EventTypeAppCard({ app, eventType }) {
  const { asPath } = useRouter();
  const [getAppData, setAppData] = useAppContextWithSchema<typeof appDataSchema>();
  const price = getAppData("price") ?? "";
  const apikey = getAppData("apikey") ?? "";
  const accessToken = getAppData("access_token");
  const currency = getAppData("currency") ?? "ARS";
  const paymentOption = getAppData("paymentOption");
  const paymentOptionSelectValue = paymentOptions.find((option) => paymentOption === option.value);
  const [requirePayment, setRequirePayment] = useState(getAppData("enabled"));
  const { t } = useLocale();
  const recurringEventDefined = eventType.recurringEvent?.count !== undefined;
  const seatsEnabled = !!eventType.seatsPerTimeSlot;
  const getCurrencySymbol = (locale: string, currency: string) =>
    (0)
      .toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/\d/g, "")
      .trim();
  return (
    <AppCard
      returnTo={WEBAPP_URL + asPath}
      setAppData={setAppData}
      app={app}
      switchChecked={requirePayment}
      switchOnClick={(enabled) => {
        setRequirePayment(enabled);
      }}
      description={
        <>
          <div className="">
            {t("payment_app_commission", {
              paymentFeePercentage: 0.5,
              fee: 0.1,
              formatParams: { fee: { currency } },
            })}
          </div>
        </>
      }>
      <>
        {recurringEventDefined ? (
          <Alert className="mt-2" severity="warning" title={t("warning_recurring_event_payment")} />
        ) : (
          requirePayment && (
            <>
              <div className="mt-2 block items-center justify-start sm:flex sm:space-x-2">
                <TextField
                  label=""
                  className="h-[38px]"
                  addOnLeading={<>{currency ? getCurrencySymbol("en", currency) : ""}</>}
                  addOnClassname="h-[38px]"
                  step="0.01"
                  min="0.5"
                  type="number"
                  required
                  placeholder="Price"
                  onChange={(e) => {
                    setAppData("price", Number(e.target.value) * 100);
                  }}
                  value={price > 0 ? price / 100 : undefined}
                />
                <Select<Option>
                  defaultValue={
                    paymentOptionSelectValue
                      ? { ...paymentOptionSelectValue, label: t(paymentOptionSelectValue.label) }
                      : { ...paymentOptions[0], label: t(paymentOptions[0].label) }
                  }
                  options={paymentOptions.map((option) => {
                    return { ...option, label: t(option.label) || option.label };
                  })}
                  onChange={(input) => {
                    if (input) setAppData("paymentOption", input.value);
                  }}
                  className="mb-1 h-[38px] w-full"
                  isDisabled={seatsEnabled}
                />
              </div>
              <label>
                {" "}
                Obten tus credenciales{" "}
                <a href="https://www.mercadopago.com.ar/settings/account/credentials" target="_blank">
                  aqui
                </a>
              </label>
              {/* <div className="mt-2 block items-center justify-start sm:flex sm:space-x-2"> */}
              <TextField
                label=""
                // className="h-[50%]"
                type="text"
                required
                placeholder="Mercadopago Public Key"
                onChange={(e) => {
                  setAppData("apikey", e.target.value);
                }}
                value={apikey ?? ""}
              />
              <TextField
                label=""
                // className="h-[50%]"
                type="text"
                required
                placeholder="Mercadopago Access Token"
                onChange={(e) => {
                  setAppData("access_token", e.target.value);
                }}
                value={accessToken ?? ""}
              />
              {/* </div> */}
              {seatsEnabled && paymentOption === "HOLD" && (
                <Alert className="mt-2" severity="warning" title={t("seats_and_no_show_fee_error")} />
              )}
            </>
          )
        )}
      </>
    </AppCard>
  );
};

export default EventTypeAppCard;
