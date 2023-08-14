import { defaultHandler } from "@calcom/lib/server";

import { withMiddleware } from "~/lib/helpers/withMiddleware";

export default withMiddleware()(
  console.log('testing 123');
  defaultHandler({
    GET: import("./_get"),
    POST: import("./_post"),
  })
);
