import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useEffect, useRef } from "react";
import { TransitionGroup } from "react-transition-group";
import { getLaunchables, needsUpdate, restart, shutdown, updateAndReload } from "../../api";
import { useAppContext } from "../../contexts/AppContext.ctx";
import { useAlwaysRef } from "../../hooks/useAlwaysRef.hook";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { usePromise } from "../../hooks/usePromise.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import { allGamepadDirection } from "../../utils/gamepad.utils";
import { clamp } from "../../utils/numbers.utils";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { OtherButton } from "../OtherButton/OtherButton";
import classes from "./Homepage.module.scss";

export type HomepageProps = {
  readonly className?: string;
};

const STICK_THRESHOLD = 0.5;

const getElementCenter = (el: HTMLElement) => {
  const { left, width } = el.getBoundingClientRect();
  return left + width / 2;
};

const findClosestElementIndex = (position: number, els: readonly HTMLElement[]): number => {
  const firstIndexOver = els.findIndex((el) => getElementCenter(el) > position);

  const beforeIndex = firstIndexOver - 1;
  const afterIndex = firstIndexOver;

  if (afterIndex < 0) return els.length - 1;
  if (beforeIndex < 0) return 0;

  const before = els[beforeIndex];
  const after = els[afterIndex];

  if (!after) return els.length - 1;
  if (!before) return 0;

  const beforePosition = getElementCenter(before);
  const afterPosition = getElementCenter(after);

  const beforeDist = Math.abs(position - beforePosition);
  const afterDist = Math.abs(position - afterPosition);

  return beforeDist < afterDist ? beforeIndex : afterIndex;
};

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
  const { setView } = useAppContext();
  const rowRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;
  const rowRefsRef = useAlwaysRef(rowRefs);

  const { status, data } = usePromise(
    // slightly delay apppearance of launchable buttons
    async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
    []
  );
  const { data: updateAvailable } = usePromise(
    // delay update button so it grabs attention by popping in
    async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
    []
  );

  const isReady = status === "data";


  const move = useCallbackStable(
    ({
      up,
      down,
      left,
      right,
    }: {
      readonly up?: boolean;
      readonly down?: boolean;
      readonly left?: boolean;
      readonly right?: boolean;
    }) => {
      const rows = rowRefsRef.current;

      const rowElements = rows.map((row) => [...(row.current?.querySelectorAll("button") || [])]);
      const focused = document.activeElement;

      let rowIndex = rows.findIndex((r) => r.current?.contains(focused));
      let colIndex = rowElements[rowIndex]?.findIndex((c) => c === focused);

      if (
        focused instanceof HTMLElement &&
        rowIndex !== -1 &&
        colIndex !== -1 &&
        colIndex !== undefined
      ) {
        const changeRow = (row: number) => {
          row = clamp(row, 0, rowElements.length - 1);
          const currentPosition = getElementCenter(focused);
          rowIndex = row;
          const buttons = rowElements[rowIndex];
          if (buttons) colIndex = findClosestElementIndex(currentPosition, buttons);
        };

        if (up) changeRow(rowIndex - 1);
        if (down) changeRow(rowIndex + 1);
        if (left) colIndex = colIndex - 1;
        if (right) colIndex = colIndex + 1;
      } else {
        rowIndex = up ? Infinity : 0;
        colIndex = left ? Infinity : 0;
      }

      rowIndex = clamp(rowIndex, 0, rowElements.length - 1);
      colIndex = clamp(colIndex, 0, (rowElements[rowIndex]?.length ?? 0) - 1);

      rowElements[rowIndex]?.[colIndex]?.focus();
    }
  );

  useEffect(() =>
    allGamepadDirection.on("value", ({ x, y }) =>
      move({
        up: y <= -STICK_THRESHOLD,
        down: y >= STICK_THRESHOLD,
        left: x <= -STICK_THRESHOLD,
        right: x >= STICK_THRESHOLD,
      })
    )
  );

  useWindowHandler(
    (e) => {
      switch (e.key) {
        case "ArrowUp":
          move({ up: true });
          break;
        case "ArrowDown":
          move({ down: true });
          break;
        case "ArrowLeft":
          move({ left: true });
          break;
        case "ArrowRight":
          move({ right: true });
          break;
      }
    },
    [move],
    "keydown"
  );

  return (
    <div className={clsx("Homepage", className, classes.root, isReady && classes["root--ready"])}>
      <div className={classes.launchables} ref={rowRefs[0]}>
        {(() => {
          switch (status) {
            case "data":
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
      </div>
      <TransitionGroup>
        <div className={classes.others} ref={rowRefs[1]}>
          {updateAvailable && (
            <OtherButton
              key="update-available"
              thinkingId="UPDATE_AVAILABLE"
              onClick={async () => {
                await updateAndReload();
              }}
            >
              update available!
            </OtherButton>
          )}
          <OtherButton
            key="configure"
            onClick={async () => { }}
          >
            configure
          </OtherButton>
          <OtherButton
            key="shutdown"
            thinkingId="SHUTDOWN"
            onClick={shutdown}
          >
            shutdown
          </OtherButton>
          <OtherButton
            key="restart"
            thinkingId="RESTART"
            onClick={restart}
          >
            restart
          </OtherButton>
          <OtherButton
            key="test"
            onClick={() => setView("WEB", "https://reddit.com")}
          >
            test
          </OtherButton>
        </div>
      </TransitionGroup>
    </div>
  );
});
