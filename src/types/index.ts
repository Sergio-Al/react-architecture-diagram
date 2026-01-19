import { Node, Edge } from '@xyflow/react';

// Node types for architecture components
export type ArchitectureNodeType = 
  | 'service' 
  | 'database' 
  | 'queue' 
  | 'cache' 
  | 'gateway' 
  | 'external' 
  | 'storage' 
  | 'client';

// Group types for infrastructure containers
export type GroupNodeType = 'vpc' | 'cluster' | 'region' | 'subnet';

export type NodeStatus = 'active' | 'inactive' | 'warning';

// Data structure for architecture nodes
export type ArchitectureNodeData = {
  label: string;
  type: ArchitectureNodeType;
  description?: string;
  technology?: string;
  port?: string;
  status?: NodeStatus;
  metadata?: Record<string, string>;
  parentId?: string; // For grouping - reference to parent group
} & Record<string, unknown>;

// Data structure for group nodes
export type GroupNodeData = {
  label: string;
  groupType: GroupNodeType;
  collapsed?: boolean;
  color?: 'zinc' | 'blue' | 'emerald' | 'purple' | 'amber';
  description?: string;
} & Record<string, unknown>;

// Edge protocol types
export type EdgeProtocol = 'http' | 'grpc' | 'websocket' | 'tcp' | 'amqp' | 'kafka';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Data structure for architecture edges
export type ArchitectureEdgeData = {
  label?: string;
  protocol?: EdgeProtocol;
  method?: HttpMethod;
  async?: boolean;
  animated?: boolean;
  description?: string;
} & Record<string, unknown>;

// Use base types from React Flow
export type ArchitectureNode = Node<ArchitectureNodeData>;
export type GroupNode = Node<GroupNodeData>;
export type ArchitectureEdge = Edge<ArchitectureEdgeData>;

// Diagram state for persistence
export interface DiagramData {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// History state for undo/redo
export interface HistoryState {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
