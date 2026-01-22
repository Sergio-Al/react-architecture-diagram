import { DiagramData, ArchitectureNodeType, GroupNodeType, EdgeProtocol, DataFormat, HttpMethod, ArchitectureNode } from '@/types';
import { Node, Edge } from '@xyflow/react';

// Current schema version for import/export compatibility
export const SCHEMA_VERSION = '1.0.0';

export interface ImportOptions {
  mode: 'replace' | 'merge' | 'append';
  includeViewport: boolean;
  validateSchema: boolean;
}

export interface ImportResult {
  success: boolean;
  data?: DiagramData;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Validate node structure
function validateNode(node: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node.id) {
    errors.push({
      field: `nodes[${index}].id`,
      message: 'Node ID is required',
      severity: 'error',
    });
  }

  if (!node.type) {
    errors.push({
      field: `nodes[${index}].type`,
      message: 'Node type is required',
      severity: 'error',
    });
  }

  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    errors.push({
      field: `nodes[${index}].position`,
      message: 'Node position must have x and y coordinates',
      severity: 'error',
    });
  }

  if (!node.data) {
    errors.push({
      field: `nodes[${index}].data`,
      message: 'Node data is required',
      severity: 'error',
    });
    return errors;
  }

  // Validate architecture node
  if (node.type === 'architecture') {
    const validTypes: ArchitectureNodeType[] = [
      'service', 'database', 'queue', 'cache', 'gateway', 'external', 'storage', 'client'
    ];
    
    if (!node.data.type || !validTypes.includes(node.data.type)) {
      errors.push({
        field: `nodes[${index}].data.type`,
        message: `Invalid architecture node type. Must be one of: ${validTypes.join(', ')}`,
        severity: 'error',
      });
    }

    if (!node.data.label || typeof node.data.label !== 'string') {
      errors.push({
        field: `nodes[${index}].data.label`,
        message: 'Node label is required and must be a string',
        severity: 'error',
      });
    }
  }

  // Validate group node
  if (node.type === 'group') {
    const validGroupTypes: GroupNodeType[] = ['vpc', 'cluster', 'region', 'subnet'];
    
    if (!node.data.groupType || !validGroupTypes.includes(node.data.groupType)) {
      errors.push({
        field: `nodes[${index}].data.groupType`,
        message: `Invalid group type. Must be one of: ${validGroupTypes.join(', ')}`,
        severity: 'error',
      });
    }

    if (!node.data.label || typeof node.data.label !== 'string') {
      errors.push({
        field: `nodes[${index}].data.label`,
        message: 'Group label is required and must be a string',
        severity: 'error',
      });
    }
  }

  // Validate comment node
  if (node.type === 'comment') {
    if (!node.data.text || typeof node.data.text !== 'string') {
      errors.push({
        field: `nodes[${index}].data.text`,
        message: 'Comment text is required and must be a string',
        severity: 'error',
      });
    }
  }

  return errors;
}

// Validate edge structure
function validateEdge(edge: any, index: number, nodeIds: Set<string>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!edge.id) {
    errors.push({
      field: `edges[${index}].id`,
      message: 'Edge ID is required',
      severity: 'error',
    });
  }

  if (!edge.source) {
    errors.push({
      field: `edges[${index}].source`,
      message: 'Edge source is required',
      severity: 'error',
    });
  } else if (!nodeIds.has(edge.source)) {
    errors.push({
      field: `edges[${index}].source`,
      message: `Edge source node '${edge.source}' does not exist`,
      severity: 'error',
    });
  }

  if (!edge.target) {
    errors.push({
      field: `edges[${index}].target`,
      message: 'Edge target is required',
      severity: 'error',
    });
  } else if (!nodeIds.has(edge.target)) {
    errors.push({
      field: `edges[${index}].target`,
      message: `Edge target node '${edge.target}' does not exist`,
      severity: 'error',
    });
  }

  // Validate protocol if present
  if (edge.data?.protocol) {
    const validProtocols: EdgeProtocol[] = [
      'http', 'https', 'grpc', 'websocket', 'tcp', 'udp', 'amqp', 'kafka', 'rabbitmq'
    ];
    
    if (!validProtocols.includes(edge.data.protocol)) {
      errors.push({
        field: `edges[${index}].data.protocol`,
        message: `Invalid protocol. Must be one of: ${validProtocols.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  // Validate data contract format if present
  if (edge.data?.dataContract?.format) {
    const validFormats: DataFormat[] = ['json', 'protobuf', 'avro', 'xml', 'binary', 'text'];
    
    if (!validFormats.includes(edge.data.dataContract.format)) {
      errors.push({
        field: `edges[${index}].data.dataContract.format`,
        message: `Invalid data format. Must be one of: ${validFormats.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  return errors;
}

// Validate viewport structure
function validateViewport(viewport: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (viewport) {
    if (typeof viewport.x !== 'number') {
      errors.push({
        field: 'viewport.x',
        message: 'Viewport x must be a number',
        severity: 'warning',
      });
    }
    if (typeof viewport.y !== 'number') {
      errors.push({
        field: 'viewport.y',
        message: 'Viewport y must be a number',
        severity: 'warning',
      });
    }
    if (typeof viewport.zoom !== 'number' || viewport.zoom <= 0) {
      errors.push({
        field: 'viewport.zoom',
        message: 'Viewport zoom must be a positive number',
        severity: 'warning',
      });
    }
  }

  return errors;
}

// Main validation function for diagram data
export function validateDiagramData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Invalid diagram data: must be an object',
      severity: 'error',
    });
    return errors;
  }

  // Validate nodes array
  if (!Array.isArray(data.nodes)) {
    errors.push({
      field: 'nodes',
      message: 'Nodes must be an array',
      severity: 'error',
    });
  } else {
    // Create set of node IDs for edge validation
    const nodeIds = new Set<string>(data.nodes.map((n: any) => n.id));

    // Validate each node
    data.nodes.forEach((node: any, index: number) => {
      errors.push(...validateNode(node, index));
    });

    // Validate edges array
    if (!Array.isArray(data.edges)) {
      errors.push({
        field: 'edges',
        message: 'Edges must be an array',
        severity: 'error',
      });
    } else {
      data.edges.forEach((edge: any, index: number) => {
        errors.push(...validateEdge(edge, index, nodeIds));
      });
    }
  }

  // Validate viewport (optional)
  if (data.viewport) {
    errors.push(...validateViewport(data.viewport));
  }

  return errors;
}

// Parse JSON with error handling
export function parseJSON(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);
    const errors = validateDiagramData(data);
    
    const criticalErrors = errors.filter(e => e.severity === 'error');
    const warnings = errors.filter(e => e.severity === 'warning');

    if (criticalErrors.length > 0) {
      return {
        success: false,
        errors: criticalErrors.map(e => `${e.field}: ${e.message}`),
        warnings: warnings.map(w => `${w.field}: ${w.message}`),
      };
    }

    return {
      success: true,
      data: data as DiagramData,
      warnings: warnings.length > 0 ? warnings.map(w => `${w.field}: ${w.message}`) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// Merge diagrams (append nodes/edges with new IDs to avoid conflicts)
export function mergeDiagramData(
  current: DiagramData,
  imported: DiagramData,
  offset = { x: 100, y: 100 }
): DiagramData {
  // Generate ID mapping for imported nodes
  const idMapping = new Map<string, string>();
  imported.nodes.forEach(node => {
    idMapping.set(node.id, `imported-${Date.now()}-${node.id}`);
  });

  // Transform imported nodes
  const transformedNodes: Node[] = imported.nodes.map(node => ({
    ...node,
    id: idMapping.get(node.id) || node.id,
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
    // Update parentId if it references an imported node
    ...(node.data?.parentId && idMapping.has(node.data.parentId)
      ? { data: { ...node.data, parentId: idMapping.get(node.data.parentId) } }
      : {}),
  }));

  // Transform imported edges
  const transformedEdges: Edge[] = imported.edges.map(edge => ({
    ...edge,
    id: `imported-${Date.now()}-${edge.id}`,
    source: idMapping.get(edge.source) || edge.source,
    target: idMapping.get(edge.target) || edge.target,
  }));

  return {
    nodes: [...current.nodes, ...transformedNodes] as ArchitectureNode[],
    edges: [...current.edges, ...transformedEdges],
    viewport: current.viewport, // Keep current viewport
  };
}

// Append diagram data (similar to merge but simpler - just adds new content)
export function appendDiagramData(
  current: DiagramData,
  imported: DiagramData,
  offset = { x: 100, y: 100 }
): DiagramData {
  // Offset all imported nodes
  const offsetNodes: Node[] = imported.nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
  }));

  return {
    nodes: [...current.nodes, ...offsetNodes] as ArchitectureNode[],
    edges: [...current.edges, ...imported.edges],
    viewport: current.viewport,
  };
}

// Parse Markdown export back to diagram data
export function parseMarkdown(markdown: string): ImportResult {
  try {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Extract components from markdown table
    const componentTableMatch = markdown.match(/## Components\n\n\| Component \|.*?\n\|[-\s|]+\n([\s\S]*?)(?=\n##|\n$)/);
    if (componentTableMatch) {
      const rows = componentTableMatch[1].trim().split('\n');
      rows.forEach((row, index) => {
        const columns = row.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 3) {
          const [label, typeStr, technology, port, description] = columns;
          
          // Map type string to node type
          const typeMap: Record<string, ArchitectureNodeType> = {
            'microservice': 'service',
            'service': 'service',
            'database': 'database',
            'sql database': 'database',
            'nosql database': 'database',
            'message queue': 'queue',
            'queue': 'queue',
            'cache': 'cache',
            'in-memory cache': 'cache',
            'api gateway': 'gateway',
            'gateway': 'gateway',
            'load balancer': 'gateway',
            'external api': 'external',
            'external': 'external',
            'third-party': 'external',
            'object storage': 'storage',
            'storage': 'storage',
            'web client': 'client',
            'mobile client': 'client',
            'client': 'client',
          };
          
          const normalizedType = typeStr.toLowerCase();
          const nodeType = typeMap[normalizedType] || 'service';
          
          nodes.push({
            id: `md-import-${index}`,
            type: 'architecture',
            position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 180 },
            data: {
              label,
              type: nodeType,
              technology: technology !== '-' ? technology : undefined,
              port: port !== '-' ? port : undefined,
              description: description !== '-' ? description : undefined,
            },
          });
        }
      });
    }

    // Create node ID map for edge resolution
    const nodeNameToId = new Map<string, string>();
    nodes.forEach(node => {
      if (node.data?.label && typeof node.data.label === 'string') {
        nodeNameToId.set(node.data.label, node.id);
      }
    });

    // Extract connections from markdown table
    const connectionTableMatch = markdown.match(/## Connections\n\n\| Source \|.*?\n\|[-\s|]+\n([\s\S]*?)(?=\n##|\n$)/);
    if (connectionTableMatch) {
      const rows = connectionTableMatch[1].trim().split('\n');
      rows.forEach((row, index) => {
        const columns = row.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 3) {
          const [source, target, protocol, method, description] = columns;
          
          const sourceId = nodeNameToId.get(source);
          const targetId = nodeNameToId.get(target);
          
          if (sourceId && targetId) {
            const edgeData: any = {};
            
            if (protocol && protocol !== '-') {
              edgeData.protocol = protocol.toLowerCase() as EdgeProtocol;
            }
            
            if (method && method !== '-') {
              edgeData.method = method as HttpMethod;
            }
            
            if (description && description !== '-') {
              edgeData.description = description;
            }
            
            edges.push({
              id: `md-edge-${index}`,
              source: sourceId,
              target: targetId,
              type: 'architecture',
              data: edgeData,
            });
          }
        }
      });
    }

    // Also try to parse Mermaid diagram if no tables found
    if (nodes.length === 0) {
      const mermaidMatch = markdown.match(/```mermaid\n([\s\S]*?)\n```/);
      if (mermaidMatch) {
        const mermaidCode = mermaidMatch[1];
        const lines = mermaidCode.split('\n').map(l => l.trim()).filter(l => l);
        
        const nodePattern = /^([a-zA-Z0-9_]+)\[(.*?)\]$/;
        const edgePattern = /^([a-zA-Z0-9_]+)\s*-->\s*([a-zA-Z0-9_]+)/;
        
        const mermaidNodeMap = new Map<string, string>();
        
        lines.forEach((line, index) => {
          // Parse node definitions
          const nodeMatch = line.match(nodePattern);
          if (nodeMatch) {
            const [, id, label] = nodeMatch;
            const nodeId = `mermaid-${id}`;
            mermaidNodeMap.set(id, nodeId);
            
            nodes.push({
              id: nodeId,
              type: 'architecture',
              position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 180 },
              data: {
                label,
                type: 'service',
              },
            });
          }
          
          // Parse edge definitions
          const edgeMatch = line.match(edgePattern);
          if (edgeMatch) {
            const [, source, target] = edgeMatch;
            const sourceId = mermaidNodeMap.get(source);
            const targetId = mermaidNodeMap.get(target);
            
            if (sourceId && targetId) {
              edges.push({
                id: `mermaid-edge-${edges.length}`,
                source: sourceId,
                target: targetId,
                type: 'architecture',
                data: {},
              });
            }
          }
        });
      }
    }

    if (nodes.length === 0) {
      return {
        success: false,
        errors: ['No valid nodes found in markdown. Expected ## Components table or Mermaid diagram.'],
      };
    }

    const diagramData: DiagramData = { nodes: nodes as ArchitectureNode[], edges };
    const errors = validateDiagramData(diagramData);
    const criticalErrors = errors.filter(e => e.severity === 'error');

    if (criticalErrors.length > 0) {
      return {
        success: false,
        errors: criticalErrors.map(e => `${e.field}: ${e.message}`),
      };
    }

    return {
      success: true,
      data: diagramData,
      warnings: [`Imported ${nodes.length} nodes and ${edges.length} edges from markdown`],
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Markdown parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// Detect file format from content
export function detectFileFormat(content: string): 'json' | 'markdown' | 'unknown' {
  const trimmed = content.trim();
  
  // Check if it's JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }
  
  // Check if it's Markdown (contains markdown headers and tables)
  if (trimmed.includes('# Architecture Diagram') || 
      (trimmed.includes('## Nodes') && trimmed.includes('## Connections'))) {
    return 'markdown';
  }
  
  return 'unknown';
}

// Main import function with auto-detection
export function importDiagram(
  content: string,
  options: Partial<ImportOptions> = {}
): ImportResult {
  const defaultOptions: ImportOptions = {
    mode: 'replace',
    includeViewport: true,
    validateSchema: true,
    ...options,
  };

  // Auto-detect format
  const format = detectFileFormat(content);
  
  if (format === 'unknown') {
    return {
      success: false,
      errors: ['Unknown file format. Expected JSON or Markdown.'],
    };
  }

  // Parse based on format
  let result: ImportResult;
  if (format === 'json') {
    result = parseJSON(content);
  } else {
    result = parseMarkdown(content);
  }

  // Remove viewport if not requested
  if (result.success && result.data && !defaultOptions.includeViewport) {
    delete result.data.viewport;
  }

  return result;
}
