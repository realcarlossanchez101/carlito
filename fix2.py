with open('src/infra/pulsecheck-runner.ts', 'r') as f:
    content = f.read()

# Fix 1: Add pulsecheckFileContent param to resolvePulsecheckRunPrompt
old_sig = """function resolvePulsecheckRunPrompt(params: {
  cfg: OpenClawConfig;
  pulsecheck?: PulsecheckConfig;
  preflight: PulsecheckPreflight;
  canRelayToUser: boolean;
  workspaceDir: string;
  startedAt: number;
}): PulsecheckPromptResolution {"""

new_sig = """function resolvePulsecheckRunPrompt(params: {
  cfg: OpenClawConfig;
  pulsecheck?: PulsecheckConfig;
  preflight: PulsecheckPreflight;
  canRelayToUser: boolean;
  workspaceDir: string;
  startedAt: number;
  pulsecheckFileContent?: string;
}): PulsecheckPromptResolution {"""

content = content.replace(old_sig, new_sig)

# Fix 2: Update the task-mode prompt to include PULSECHECK.md directives
old_prompt = '''    if (dueTasks.length > 0) {
      const taskList = dueTasks.map((task) => `- ${task.name}: ${task.prompt}`).join("\\n");
      const prompt = `Run the following periodic tasks (only those due based on their intervals):

${taskList}

After completing all due tasks, reply PULSECHECK_OK.`;
      return { prompt, hasExecCompletion: false, hasCronEvents: false };
    }'''

new_prompt = '''    if (dueTasks.length > 0) {
      const taskList = dueTasks.map((task) => `- ${task.name}: ${task.prompt}`).join("\\n");
      let prompt = `Run the following periodic tasks (only those due based on their intervals):

${taskList}

After completing all due tasks, reply PULSECHECK_OK.`;

      // Preserve PULSECHECK.md directives (non-task content)
      if (params.pulsecheckFileContent) {
        const directives = params.pulsecheckFileContent
          .replace(/^tasks:\\n(?:[ \\t].*\\n)*/m, "")
          .trim();
        if (directives) {
          prompt += `\\n\\nAdditional context from PULSECHECK.md:\\n${directives}`;
        }
      }
      return { prompt, hasExecCompletion: false, hasCronEvents: false };
    }'''

content = content.replace(old_prompt, new_prompt)

# Fix 3: Pass pulsecheckFileContent from call site
old_call = """  const { prompt, hasExecCompletion, hasCronEvents } = resolvePulsecheckRunPrompt({
    cfg,
    pulsecheck,
    preflight,
    canRelayToUser,
    workspaceDir,
    startedAt,
  });"""

new_call = """  const { prompt, hasExecCompletion, hasCronEvents } = resolvePulsecheckRunPrompt({
    cfg,
    pulsecheck,
    preflight,
    canRelayToUser,
    workspaceDir,
    startedAt,
    pulsecheckFileContent: preflight.pulsecheckFileContent,
  });"""

content = content.replace(old_call, new_call)

with open('src/infra/pulsecheck-runner.ts', 'w') as f:
    f.write(content)

print("Fix #2 applied: PULSECHECK.md directives preserved in task-mode prompt")
