import * as React from "react";
import { Fetcher } from "../types";
export interface ExecuteContext {
  fetcher: Fetcher<boolean>;
}
const { Provider, Consumer } = React.createContext<ExecuteContext>({
  fetcher: { loading: false, data: undefined, error: null }
});

export { Provider, Consumer };
