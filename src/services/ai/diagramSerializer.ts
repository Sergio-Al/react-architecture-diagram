import { DiagramData, ArchitectureNodeData, GroupNodeData } from '@/types';
import { SerializedDiagram } from '@/types/ai';

/**
 * Convert DiagramData to a serialized format optimized for AI prompts
 */
export function serializeDiagram(diagram: DiagramData): SerializedDiagram {
  const { nodes, edges } = diagram;

  // Count node types and protocols for metadata
  const nodeTypes: Record<string, number> = {};
  const protocols: Record<string, number> = {};

  // Serialize nodes
  const serializedNodes = nodes.map((node) => {
    const baseData = {
      id: node.id,
      type: node.type || 'unknown',
      label: '',
    };

    // Handle different node types
    if (node.type === 'architecture') {
      const data = node.data as ArchitectureNodeData;
      const nodeType = data.type || 'unknown';
      nodeTypes[nodeType] = (nodeTypes[nodeType] || 0) + 1;

      return {
        ...baseData,
        label: data.label,
        description: data.description,
        technology: data.technology,
        port: data.port,
      };
    }

    if (node.type === 'group') {
      const data = node.data as unknown as GroupNodeData;
      const groupType = data.groupType || 'unknown';
      nodeTypes[groupType] = (nodeTypes[groupType] || 0) + 1;

      return {
        ...baseData,
        label: data.label,
        groupType: data.groupType,
        description: data.description,
      };
    }

    if (node.type === 'comment') {
      nodeTypes['comment'] = (nodeTypes['comment'] || 0) + 1;
      return {
        ...baseData,
        label: 'Comment',
      };
    }

    return baseData;
  });

  // Serialize edges
  const serializedEdges = edges.map((edge) => {
    const protocol = edge.data?.protocol || 'unknown';
    protocols[protocol] = (protocols[protocol] || 0) + 1;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      protocol: edge.data?.protocol,
      method: edge.data?.method,
      description: edge.data?.description,
    };
  });

  return {
    nodes: serializedNodes,
    edges: serializedEdges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes,
      protocols,
    },
  };
}

/**
 * Generate a hash of the diagram for caching purposes
 */
export function generateDiagramHash(diagram: DiagramData): string {
  const simplified = {
    nodes: diagram.nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
    edges: diagram.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
  
  // Simple hash function (for cache key, not security)
  const str = JSON.stringify(simplified);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Convert serialized diagram to a human-readable text format for AI prompts
 */
export function diagramToText(serialized: SerializedDiagram): string {
  let text = '# Architecture Diagram\n\n';

  // Metadata
  text += `## Overview\n`;
  text += `- Total Components: ${serialized.metadata.totalNodes}\n`;
  text += `- Total Connections: ${serialized.metadata.totalEdges}\n\n`;

  // Node types breakdown
  text += `### Component Types:\n`;
  Object.entries(serialized.metadata.nodeTypes).forEach(([type, count]) => {
    text += `- ${type}: ${count}\n`;
  });
  text += '\n';

  // Protocols breakdown
  if (Object.keys(serialized.metadata.protocols).length > 0) {
    text += `### Communication Protocols:\n`;
    Object.entries(serialized.metadata.protocols).forEach(([protocol, count]) => {
      text += `- ${protocol}: ${count} connection(s)\n`;
    });
    text += '\n';
  }

  // Components list
  text += `## Components\n\n`;
  serialized.nodes.forEach((node) => {
    text += `### ${node.label || node.id}\n`;
    text += `- ID: ${node.id}\n`;
    text += `- Type: ${node.type}\n`;
    if (node.technology) text += `- Technology: ${node.technology}\n`;
    if (node.port) text += `- Port: ${node.port}\n`;
    if (node.groupType) text += `- Group Type: ${node.groupType}\n`;
    if (node.description) text += `- Description: ${node.description}\n`;
    text += '\n';
  });

  // Connections list
  if (serialized.edges.length > 0) {
    text += `## Connections\n\n`;
    serialized.edges.forEach((edge) => {
      const sourceNode = serialized.nodes.find((n) => n.id === edge.source);
      const targetNode = serialized.nodes.find((n) => n.id === edge.target);
      const sourceName = sourceNode?.label || edge.source;
      const targetName = targetNode?.label || edge.target;

      text += `- **${sourceName}** → **${targetName}**\n`;
      if (edge.protocol) text += `  - Protocol: ${edge.protocol}\n`;
      if (edge.method) text += `  - Method: ${edge.method}\n`;
      if (edge.description) text += `  - Description: ${edge.description}\n`;
      text += '\n';
    });
  }

  return text;
}
