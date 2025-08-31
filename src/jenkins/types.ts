/**
 * TypeScript type definitions for Jenkins API
 */

export interface JenkinsJob {
  name: string;
  url: string;
  color: JobColor;
  buildable: boolean;
  displayName: string;
  description?: string;
  inQueue: boolean;
  keepDependencies: boolean;
  nextBuildNumber: number;
  property: JobProperty[];
  queueItem?: QueueItem;
  concurrentBuild: boolean;
  downstreamProjects: JenkinsJob[];
  upstreamProjects: JenkinsJob[];
  scm: ScmInfo;
  actions: JobAction[];
}

export interface JenkinsBuild {
  number: number;
  url: string;
  displayName: string;
  description?: string;
  building: boolean;
  duration: number;
  estimatedDuration: number;
  executor?: Executor;
  keepLog: boolean;
  queueId: number;
  result: BuildResult;
  timestamp: number;
  builtOn: string;
  changeSet: ChangeSet;
  actions: BuildAction[];
  artifacts: Artifact[];
  fingerprint: Fingerprint[];
}

export interface JenkinsNode {
  displayName: string;
  description: string;
  executors: Executor[];
  icon: string;
  iconClassName: string;
  idle: boolean;
  jnlpAgent: boolean;
  launchSupported: boolean;
  loadStatistics: LoadStatistics;
  manualLaunchAllowed: boolean;
  monitorData: MonitorData;
  numExecutors: number;
  offline: boolean;
  offlineCause?: OfflineCause;
  offlineCauseReason?: string;
  oneOffExecutors: Executor[];
  temporarilyOffline: boolean;
  absoluteRemotePath?: string;
}

export interface JenkinsPipeline {
  name: string;
  displayName: string;
  fullDisplayName: string;
  description?: string;
  type: string;
  estimatedDuration: number;
  runSummary: PipelineRunSummary;
  latestRun?: PipelineRun;
  permissions: PipelinePermissions;
  parameters?: PipelineParameter[];
  organization: string;
  weatherScore: number;
}

export interface PipelineRun {
  id: string;
  name: string;
  status: PipelineStatus;
  startTime: string;
  endTime?: string;
  durationInMillis: number;
  estimatedDurationInMillis?: number;
  organization: string;
  pipeline: string;
  commitId?: string;
  runSummary: string;
  type: string;
  state: PipelineState;
  result: PipelineResult;
  stages?: PipelineStage[];
  artifacts?: Artifact[];
  changeSet?: ChangeSet;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStatus;
  startTime: string;
  durationInMillis: number;
  pauseDurationInMillis: number;
  type: string;
  state: PipelineState;
  result: PipelineResult;
  input?: StageInput;
  steps?: PipelineStep[];
}

export interface PipelineStep {
  id: string;
  name: string;
  status: PipelineStatus;
  startTime: string;
  durationInMillis: number;
  type: string;
  state: PipelineState;
  result: PipelineResult;
  log?: StepLog;
}

export interface QueueItem {
  id: number;
  inQueueSince: number;
  params: string;
  stuck: boolean;
  task: QueueTask;
  url: string;
  why?: string;
  buildableStartMilliseconds?: number;
  pending: boolean;
  buildable: boolean;
  blocked: boolean;
}

// Enums and Types
export type JobColor =
  | "red"
  | "red_anime" // Failed
  | "yellow"
  | "yellow_anime" // Unstable
  | "blue"
  | "blue_anime" // Success
  | "grey"
  | "grey_anime" // Never built/Disabled
  | "disabled" // Disabled
  | "aborted"
  | "aborted_anime" // Aborted
  | "notbuilt"
  | "notbuilt_anime"; // Not built

export type BuildResult =
  | "SUCCESS"
  | "UNSTABLE"
  | "FAILURE"
  | "NOT_BUILT"
  | "ABORTED"
  | null;

export type PipelineStatus =
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "SUCCESS"
  | "FAILED"
  | "UNSTABLE"
  | "ABORTED"
  | "NOT_EXECUTED"
  | "UNKNOWN";

export type PipelineState =
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "FINISHED";

export type PipelineResult =
  | "SUCCESS"
  | "FAILURE"
  | "UNSTABLE"
  | "ABORTED"
  | "NOT_BUILT"
  | "UNKNOWN"
  | null;

// Supporting interfaces
export interface JobProperty {
  _class: string;
  [key: string]: unknown;
}

export interface JobAction {
  _class: string;
  [key: string]: unknown;
}

export interface BuildAction {
  _class: string;
  [key: string]: unknown;
}

export interface QueueTask {
  name: string;
  url: string;
  color: JobColor;
}

export interface Executor {
  currentExecutable?: ExecutableItem;
  currentWorkUnit?: WorkUnit;
  idle: boolean;
  likelyStuck: boolean;
  number: number;
  progress: number;
}

export interface ExecutableItem {
  number: number;
  url: string;
}

export interface WorkUnit {
  [key: string]: unknown;
}

export interface ChangeSet {
  items: ChangeSetItem[];
  kind: string;
  revisions: ChangeSetRevision[];
}

export interface ChangeSetItem {
  affectedPaths: string[];
  author: Author;
  comment: string;
  commitId: string;
  date: string;
  id: string;
  msg: string;
  paths: ChangePath[];
  timestamp: number;
}

export interface ChangeSetRevision {
  module: string;
  revision: string;
}

export interface Author {
  absoluteUrl: string;
  fullName: string;
}

export interface ChangePath {
  editType: "add" | "edit" | "delete";
  file: string;
}

export interface Artifact {
  displayPath: string;
  fileName: string;
  relativePath: string;
}

export interface Fingerprint {
  fileName: string;
  hash: string;
  original: FingerprintOriginal;
  timestamp: number;
  usage: FingerprintUsage[];
}

export interface FingerprintOriginal {
  name: string;
  number: number;
}

export interface FingerprintUsage {
  name: string;
  ranges: FingerprintRange[];
}

export interface FingerprintRange {
  end: number;
  start: number;
}

export interface ScmInfo {
  _class: string;
  [key: string]: unknown;
}

export interface LoadStatistics {
  busyExecutors: number;
  connectingExecutors: number;
  definedExecutors: number;
  idleExecutors: number;
  onlineExecutors: number;
  queueLength: number;
  totalExecutors: number;
}

export interface MonitorData {
  [key: string]: unknown;
}

export interface OfflineCause {
  _class: string;
  description: string;
  timestamp: number;
}

export interface PipelineRunSummary {
  stable: number;
  failed: number;
  unstable: number;
  unknown: number;
}

export interface PipelinePermissions {
  create: boolean;
  read: boolean;
  start: boolean;
  stop: boolean;
}

export interface PipelineParameter {
  name: string;
  type: string;
  defaultValue?: unknown;
  description?: string;
}

export interface StageInput {
  id: string;
  message: string;
  ok: string;
  parameters: InputParameter[];
  submitter?: string;
}

export interface InputParameter {
  name: string;
  type: string;
  defaultValue?: unknown;
  description?: string;
}

export interface StepLog {
  nodeId: string;
  nodeStatus: string;
  length: number;
  hasMore: boolean;
  text: string;
}

// API Request/Response types
export interface JobTriggerRequest {
  jobName: string;
  parameters?: Record<string, string | number | boolean>;
  branch?: string;
  delay?: number;
}

export interface JobTriggerResponse {
  success: boolean;
  jobName: string;
  queueItem?: QueueItem;
  message: string;
}

export interface BuildLogsRequest {
  jobName: string;
  buildNumber: number | string;
  start?: number;
  progressiveLog?: boolean;
}

export interface BuildLogsResponse {
  text: string;
  hasMore: boolean;
  size: number;
}

export interface JobStatusRequest {
  jobName: string;
  buildNumber?: number | string;
}

export interface JobStatusResponse {
  job: JenkinsJob;
  lastBuild?: JenkinsBuild;
  isBuilding: boolean;
  queueItem?: QueueItem;
}

export interface NodeStatusRequest {
  nodeName?: string;
}

export interface NodeStatusResponse {
  nodes: JenkinsNode[];
}

// Configuration types
export interface JenkinsConfig {
  url: string;
  username?: string;
  apiToken?: string;
  password?: string;
  timeout?: number;
  retries?: number;
}

// Agent Management types
export interface AgentRestartRequest {
  nodeName: string;
  platform: "linux" | "windows" | "auto";
  force?: boolean;
  serviceCommand?: string;
  useAnsible?: boolean;
  ansiblePlaybook?: string;
  ansibleInventory?: string;
  ansibleVariables?: Record<string, string | number | boolean>;
  templateConfig?: {
    templateName: string;
    variables: Record<string, string | number | boolean>;
  };
  // Privilege and authorization options
  bypassPrivilegeCheck?: boolean;
  userRole?: "admin" | "user" | "operator";
  requireConfirmation?: boolean;
  dryRun?: boolean;
}

export interface AgentRestartResponse {
  success: boolean;
  message: string;
  nodeName: string;
  platform: string;
  commandExecuted: string;
  output?: string;
  error?: string;
  ansiblePlaybook?: string;
  templateUsed?: string;
  playbookOutput?: string;
  executionMethod: "direct" | "ansible" | "template";
  privilegeCheckBypassed?: boolean;
  userRole?: string;
  jenkinsPlatformResponse?: string;
  dryRunResult?: boolean;
}

export interface AgentDiagnosticsRequest {
  nodeName: string;
  includeSystemInfo?: boolean;
  includeLogs?: boolean;
}

export interface AgentDiagnosticsResponse {
  nodeName: string;
  status: "online" | "offline" | "disconnected" | "unknown";
  platform: string;
  systemInfo?: {
    cpu: number;
    memory: {
      total: number;
      used: number;
      available: number;
    };
    disk: {
      total: number;
      used: number;
      available: number;
    };
  };
  networkInfo?: {
    latency: number;
    connectionStatus: string;
  };
  serviceInfo?: {
    status: "running" | "stopped" | "error" | "unknown";
    pid?: number;
    uptime?: string;
  };
  recentErrors?: string[];
  buildHistory?: {
    totalBuilds: number;
    failedBuilds: number;
    recentFailures: number;
  };
}

export interface AgentRecoveryRequest {
  nodeName: string;
  strategy: "soft" | "hard" | "auto";
  maxRetries?: number;
}

export interface AgentRecoveryResponse {
  success: boolean;
  nodeName: string;
  strategy: string;
  steps: {
    step: string;
    status: "success" | "failed" | "skipped";
    message: string;
    timestamp: string;
  }[];
  finalStatus: "recovered" | "failed" | "partial";
}

export interface AgentIssueDetection {
  nodeName: string;
  issues: {
    type:
      | "connection"
      | "performance"
      | "build_failure"
      | "resource"
      | "service";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    detected: string;
    suggestion: string;
  }[];
  recommendedAction: "monitor" | "restart_service" | "reboot" | "investigate";
  confidence: number;
}

// Admin Authorization types
export interface AdminActionRequest {
  action: string;
  nodeName?: string;
  userId: string;
  justification?: string;
}

export interface AdminActionResponse {
  authorized: boolean;
  userId: string;
  roles: string[];
  permissions: string[];
  message: string;
}

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  target: string;
  result: "success" | "failed" | "denied";
  details: Record<string, string | number | boolean>;
  ipAddress?: string;
}
