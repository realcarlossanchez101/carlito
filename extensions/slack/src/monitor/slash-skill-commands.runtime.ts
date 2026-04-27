import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "carlito/plugin-sdk/command-auth";

type ListSkillCommandsForAgents =
  typeof import("carlito/plugin-sdk/command-auth").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
