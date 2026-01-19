import { ArchitectureNodeType, GroupNodeType } from '@/types';
import {
  CpuChipIcon,
  CircleStackIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  GlobeAltIcon,
  CloudIcon,
  ArchiveBoxIcon,
  UserIcon,
  ServerStackIcon,
  GlobeAmericasIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';

// Node type configuration with colors and icons
export const NODE_TYPES_CONFIG: Record<
  ArchitectureNodeType,
  {
    label: string;
    description: string;
    icon: typeof CpuChipIcon;
    iconColor: string;
    bgClass: string;
    borderClass: string;
    // Legacy props for compatibility
    color: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
  }
> = {
  service: {
    label: 'Service',
    description: 'Microservice',
    icon: CpuChipIcon,
    iconColor: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    color: 'text-blue-400',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
  },
  database: {
    label: 'PostgreSQL',
    description: 'Relational DB',
    icon: CircleStackIcon,
    iconColor: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800',
  },
  queue: {
    label: 'RabbitMQ',
    description: 'Message Broker',
    icon: ChatBubbleLeftRightIcon,
    iconColor: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    color: 'text-amber-400',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950',
    borderLight: 'border-orange-200',
    borderDark: 'dark:border-orange-800',
  },
  cache: {
    label: 'Redis Cache',
    description: 'In-memory',
    icon: BoltIcon,
    iconColor: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    color: 'text-red-400',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950',
    borderLight: 'border-yellow-200',
    borderDark: 'dark:border-yellow-800',
  },
  gateway: {
    label: 'Gateway',
    description: 'API Gateway',
    icon: GlobeAltIcon,
    iconColor: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    color: 'text-purple-400',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-800',
  },
  external: {
    label: 'External API',
    description: 'Third-party',
    icon: CloudIcon,
    iconColor: 'text-slate-400',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20',
    color: 'text-slate-400',
    bgLight: 'bg-slate-50',
    bgDark: 'dark:bg-slate-950',
    borderLight: 'border-slate-200',
    borderDark: 'dark:border-slate-800',
  },
  storage: {
    label: 'S3 Storage',
    description: 'Object Storage',
    icon: ArchiveBoxIcon,
    iconColor: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    color: 'text-cyan-400',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950',
    borderLight: 'border-cyan-200',
    borderDark: 'dark:border-cyan-800',
  },
  client: {
    label: 'Client',
    description: 'Frontend App',
    icon: UserIcon,
    iconColor: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20',
    color: 'text-pink-400',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-950',
    borderLight: 'border-pink-200',
    borderDark: 'dark:border-pink-800',
  },
};

// Edge styles by protocol
export const EDGE_STYLES: Record<
  string,
  {
    strokeDasharray?: string;
    animated?: boolean;
    strokeWidth: number;
  }
> = {
  http: { strokeWidth: 2 },
  grpc: { strokeDasharray: '5 5', strokeWidth: 2 },
  websocket: { animated: true, strokeWidth: 2 },
  tcp: { strokeWidth: 3 },
  amqp: { strokeDasharray: '2 2', animated: true, strokeWidth: 2 },
  kafka: { strokeDasharray: '2 2', animated: true, strokeWidth: 2 },
};

// Local storage key for diagram persistence
export const STORAGE_KEY = 'architecture-diagram-data';

// Debounce time for auto-save (ms)
export const AUTO_SAVE_DEBOUNCE = 1000;

// Max history states for undo/redo
export const MAX_HISTORY_LENGTH = 50;

// Group type configuration
export const GROUP_TYPES_CONFIG: Record<
  GroupNodeType,
  {
    label: string;
    description: string;
    icon: typeof CloudIcon;
    defaultLabel: string;
  }
> = {
  vpc: {
    label: 'VPC',
    description: 'Virtual Private Cloud',
    icon: CloudIcon,
    defaultLabel: 'VPC',
  },
  cluster: {
    label: 'Cluster',
    description: 'Service Cluster',
    icon: ServerStackIcon,
    defaultLabel: 'Cluster',
  },
  region: {
    label: 'Region',
    description: 'Cloud Region',
    icon: GlobeAmericasIcon,
    defaultLabel: 'Region',
  },
  subnet: {
    label: 'Subnet',
    description: 'Network Subnet',
    icon: RectangleGroupIcon,
    defaultLabel: 'Subnet',
  },
};
