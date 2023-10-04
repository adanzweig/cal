import { useEffect, useState } from "react";

import { IS_SELF_HOSTED } from "@calcom/lib/constants";

// Relative to prevent triggering a recompile
import pkg from "../../../../apps/web/package.json";

export const CalComVersion = `v.${pkg.version}-${!IS_SELF_HOSTED ? "h" : "sh"}`;

export default function Credits() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <small className="text-default mx-3 mb-2 mt-1 hidden text-[0.5rem] opacity-50 lg:block">
      &copy; {new Date().getFullYear()}{" "}
    </small>
  );
}
