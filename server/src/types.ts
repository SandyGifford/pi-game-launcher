import type { Launchable } from "@repo/shared";
import type { DistributedOmit } from "type-fest";

export type NewLaunchable = DistributedOmit<Launchable, "id">;
