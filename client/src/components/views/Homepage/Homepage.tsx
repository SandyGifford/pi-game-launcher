import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLaunchables, needsUpdate, restart, shutdown, updateAndReload } from "../../../api";
import { useAppContext } from "../../../contexts/AppContext.ctx";
import { useViewReadyOnMount } from "../../View/View.ctx";
import classes from "./Homepage.module.scss";
import { ButtonGroup } from "../../ui/button-group/components/ButtonGroup/ButtonGroup";
import { ButtonGroupRow } from "../../ui/button-group/components/ButtonGroupRow/ButtonGroupRow";
import { ButtonGroupButton } from "../../ui/button-group/components/ButtonGroupButton/ButtonGroupButton";
import { LaunchableButton } from "../../ui/LaunchableButton/LaunchableButton";

export type HomepageProps = {
  readonly className?: string;
};

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
  useViewReadyOnMount();
  const { setView } = useAppContext();

  const { status, data } = useQuery({
    queryKey: ["launchables"],
    queryFn: async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
    retry: false,
  });

  const { data: updateAvailable } = useQuery({
    queryKey: ["system", "update", "needs"],
    queryFn: async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
    retry: false,
  });

  const isReady = status === "success";

  return (
    <ButtonGroup className={clsx("Homepage", className, classes.root)} ready={isReady}>
      <ButtonGroupRow gap="wide">
        {(() => {
          switch (status) {
            case "success":
              return data.map((launchable) => (
                <LaunchableButton
                  key={launchable.id}
                  className={classes.launchable}
                  launchable={launchable}
                />
              ));
            default:
              return;
          }
        })()}
      </ButtonGroupRow>
      <ButtonGroupRow className={classes.others}>
        {updateAvailable && (
          <ButtonGroupButton
            key="update-available"
            thinkingId="UPDATE_AVAILABLE"
            onClick={async () => {
              await updateAndReload();
            }}
          >
            update available!
          </ButtonGroupButton>
        )}
        <ButtonGroupButton key="configure" onClick={() => setView("SETTINGS")}>
          configure
        </ButtonGroupButton>
        <ButtonGroupButton key="shutdown" thinkingId="SHUTDOWN" onClick={shutdown}>
          shutdown
        </ButtonGroupButton>
        <ButtonGroupButton key="restart" thinkingId="RESTART" onClick={restart}>
          restart
        </ButtonGroupButton>
      </ButtonGroupRow>
    </ButtonGroup>
  );
});

Homepage.displayName = "Homepage";
