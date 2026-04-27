export type CarlitoPiCodingAgentSkillSourceAugmentation = never;

declare module "@mariozechner/pi-coding-agent" {
  interface Skill {
    // Carlito relies on the source identifier returned by pi skill loaders.
    source: string;
  }
}
