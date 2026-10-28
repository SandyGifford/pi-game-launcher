import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useEffect, useState } from "react";
import { TransitionGroup } from "react-transition-group";
import { AppContext } from "../../contexts/AppContext.ctx";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { useInUse } from "../../hooks/useInUse.hook";
import type { SetView, ViewName, ViewParameters } from "../../types/view.types";
import { renderView } from "../../utils/view.utils";
import { View } from "../View/View";
import classes from "./App.module.scss";

export type AppProps = {
  readonly className?: string;
};

type ViewState<VIEW extends ViewName = ViewName> = {
  readonly view: VIEW;
  readonly args: ViewParameters<VIEW>;
};

const DEFAULT_VIEW: ViewState<"HOME"> = { view: "HOME", args: [] };

export const App: FC<AppProps> = memo(({ className }) => {
  const { inUse: thinking, reserveWhile: thinkWhile } = useInUse();
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW);

  const setView = useCallbackStable<SetView>((view, ...args) => setViewState({ view, args }));

  useEffect(() => {
    // animate briefly on mount
    thinkWhile(() => awaitTime(1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext thinkWhile={thinkWhile} setView={setView}>
      <div className={clsx("App", className, classes.root, thinking && classes["root--thinking"])}>
        <TransitionGroup>
          <View key={viewState.view}>
            {(transitionStatus) =>
              renderView(viewState.view, { transitionStatus }, ...viewState.args)
            }
          </View>
        </TransitionGroup>
      </div>
    </AppContext>
  );
});
