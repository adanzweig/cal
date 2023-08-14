import type { NextApiRequest, NextApiResponse } from "next";

import { defaultHandler, defaultResponder } from "@calcom/lib/server";

import { withMiddleware } from "~/lib/helpers/withMiddleware";

import authMiddleware from "./_auth-middleware";

export default withMiddleware()(
  defaultResponder(async (req: NextApiRequest, res: NextApiResponse) => {
    console.log('testing 1234');
    await authMiddleware(req);
    return defaultHandler({
      GET: import("./_get"),
      PATCH: import("./_patch"),
      DELETE: import("./_delete"),
    })(req, res);
  })
);
