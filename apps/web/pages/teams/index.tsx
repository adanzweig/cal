import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { TeamsListing } from "@calcom/features/ee/teams/components";
import Shell from "@calcom/features/shell/Shell";
import { useLocale } from "@calcom/lib/hooks/useLocale";

import PageWrapper from "@components/PageWrapper";

function Teams() {
  const { t } = useLocale();
  return (
    <Shell heading={t("teams")} hideHeadingOnMobile subtitle={t("create_manage_teams_collaborative")}>
      <TeamsListing />
    </Shell>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      ...(await serverSideTranslations("en", ["common"])),
    },
  };
};

Teams.requiresLicense = false;
Teams.PageWrapper = PageWrapper;

export default Teams;
