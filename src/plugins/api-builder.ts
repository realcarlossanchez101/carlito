import type { CarlitoConfig } from "../config/types.carlito.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { CarlitoPluginApi, PluginLogger } from "./types.js";

export type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: CarlitoPluginApi["registrationMode"];
  config: CarlitoConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      CarlitoPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerCli"
      | "registerReload"
      | "registerNodeHostCommand"
      | "registerSecurityAuditCollector"
      | "registerService"
      | "registerCliBackend"
      | "registerTextTransforms"
      | "registerConfigMigration"
      | "registerAutoEnableProbe"
      | "registerProvider"
      | "registerSpeechProvider"
      | "registerRealtimeTranscriptionProvider"
      | "registerRealtimeVoiceProvider"
      | "registerMediaUnderstandingProvider"
      | "registerImageGenerationProvider"
      | "registerVideoGenerationProvider"
      | "registerMusicGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerCompactionProvider"
      | "registerAgentHarness"
      | "registerEmbeddedExtensionFactory"
      | "registerCodexAppServerExtensionFactory"
      | "registerDetachedTaskRuntime"
      | "registerMemoryCapability"
      | "registerMemoryPromptSection"
      | "registerMemoryPromptSupplement"
      | "registerMemoryCorpusSupplement"
      | "registerMemoryFlushPlan"
      | "registerMemoryRuntime"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: CarlitoPluginApi["registerTool"] = () => {};
const noopRegisterHook: CarlitoPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: CarlitoPluginApi["registerHttpRoute"] = () => {};
const noopRegisterChannel: CarlitoPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: CarlitoPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterCli: CarlitoPluginApi["registerCli"] = () => {};
const noopRegisterReload: CarlitoPluginApi["registerReload"] = () => {};
const noopRegisterNodeHostCommand: CarlitoPluginApi["registerNodeHostCommand"] = () => {};
const noopRegisterSecurityAuditCollector: CarlitoPluginApi["registerSecurityAuditCollector"] =
  () => {};
const noopRegisterService: CarlitoPluginApi["registerService"] = () => {};
const noopRegisterCliBackend: CarlitoPluginApi["registerCliBackend"] = () => {};
const noopRegisterTextTransforms: CarlitoPluginApi["registerTextTransforms"] = () => {};
const noopRegisterConfigMigration: CarlitoPluginApi["registerConfigMigration"] = () => {};
const noopRegisterAutoEnableProbe: CarlitoPluginApi["registerAutoEnableProbe"] = () => {};
const noopRegisterProvider: CarlitoPluginApi["registerProvider"] = () => {};
const noopRegisterSpeechProvider: CarlitoPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterRealtimeTranscriptionProvider: CarlitoPluginApi["registerRealtimeTranscriptionProvider"] =
  () => {};
const noopRegisterRealtimeVoiceProvider: CarlitoPluginApi["registerRealtimeVoiceProvider"] =
  () => {};
const noopRegisterMediaUnderstandingProvider: CarlitoPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: CarlitoPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterVideoGenerationProvider: CarlitoPluginApi["registerVideoGenerationProvider"] =
  () => {};
const noopRegisterMusicGenerationProvider: CarlitoPluginApi["registerMusicGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: CarlitoPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: CarlitoPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: CarlitoPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: CarlitoPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: CarlitoPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: CarlitoPluginApi["registerContextEngine"] = () => {};
const noopRegisterCompactionProvider: CarlitoPluginApi["registerCompactionProvider"] = () => {};
const noopRegisterAgentHarness: CarlitoPluginApi["registerAgentHarness"] = () => {};
const noopRegisterEmbeddedExtensionFactory: CarlitoPluginApi["registerEmbeddedExtensionFactory"] =
  () => {};
const noopRegisterCodexAppServerExtensionFactory: CarlitoPluginApi["registerCodexAppServerExtensionFactory"] =
  () => {};
const noopRegisterDetachedTaskRuntime: CarlitoPluginApi["registerDetachedTaskRuntime"] = () => {};
const noopRegisterMemoryCapability: CarlitoPluginApi["registerMemoryCapability"] = () => {};
const noopRegisterMemoryPromptSection: CarlitoPluginApi["registerMemoryPromptSection"] = () => {};
const noopRegisterMemoryPromptSupplement: CarlitoPluginApi["registerMemoryPromptSupplement"] =
  () => {};
const noopRegisterMemoryCorpusSupplement: CarlitoPluginApi["registerMemoryCorpusSupplement"] =
  () => {};
const noopRegisterMemoryFlushPlan: CarlitoPluginApi["registerMemoryFlushPlan"] = () => {};
const noopRegisterMemoryRuntime: CarlitoPluginApi["registerMemoryRuntime"] = () => {};
const noopRegisterMemoryEmbeddingProvider: CarlitoPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: CarlitoPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): CarlitoPluginApi {
  const handlers = params.handlers ?? {};
  return {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerCli: handlers.registerCli ?? noopRegisterCli,
    registerReload: handlers.registerReload ?? noopRegisterReload,
    registerNodeHostCommand: handlers.registerNodeHostCommand ?? noopRegisterNodeHostCommand,
    registerSecurityAuditCollector:
      handlers.registerSecurityAuditCollector ?? noopRegisterSecurityAuditCollector,
    registerService: handlers.registerService ?? noopRegisterService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerTextTransforms: handlers.registerTextTransforms ?? noopRegisterTextTransforms,
    registerConfigMigration: handlers.registerConfigMigration ?? noopRegisterConfigMigration,
    registerAutoEnableProbe: handlers.registerAutoEnableProbe ?? noopRegisterAutoEnableProbe,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerRealtimeTranscriptionProvider:
      handlers.registerRealtimeTranscriptionProvider ?? noopRegisterRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider:
      handlers.registerRealtimeVoiceProvider ?? noopRegisterRealtimeVoiceProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerVideoGenerationProvider:
      handlers.registerVideoGenerationProvider ?? noopRegisterVideoGenerationProvider,
    registerMusicGenerationProvider:
      handlers.registerMusicGenerationProvider ?? noopRegisterMusicGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerCompactionProvider:
      handlers.registerCompactionProvider ?? noopRegisterCompactionProvider,
    registerAgentHarness: handlers.registerAgentHarness ?? noopRegisterAgentHarness,
    registerEmbeddedExtensionFactory:
      handlers.registerEmbeddedExtensionFactory ?? noopRegisterEmbeddedExtensionFactory,
    registerCodexAppServerExtensionFactory:
      handlers.registerCodexAppServerExtensionFactory ?? noopRegisterCodexAppServerExtensionFactory,
    registerDetachedTaskRuntime:
      handlers.registerDetachedTaskRuntime ?? noopRegisterDetachedTaskRuntime,
    registerMemoryCapability: handlers.registerMemoryCapability ?? noopRegisterMemoryCapability,
    registerMemoryPromptSection:
      handlers.registerMemoryPromptSection ?? noopRegisterMemoryPromptSection,
    registerMemoryPromptSupplement:
      handlers.registerMemoryPromptSupplement ?? noopRegisterMemoryPromptSupplement,
    registerMemoryCorpusSupplement:
      handlers.registerMemoryCorpusSupplement ?? noopRegisterMemoryCorpusSupplement,
    registerMemoryFlushPlan: handlers.registerMemoryFlushPlan ?? noopRegisterMemoryFlushPlan,
    registerMemoryRuntime: handlers.registerMemoryRuntime ?? noopRegisterMemoryRuntime,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
}
