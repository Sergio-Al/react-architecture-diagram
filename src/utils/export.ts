import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { DiagramData, ArchitectureNodeData, GroupNodeData, ArchitectureEdgeData } from '@/types';
import { NODE_TYPES_CONFIG, GROUP_TYPES_CONFIG } from '@/constants';
import { STORAGE_KEY } from '@/constants';
import pako from 'pako';
import { Node } from '@xyflow/react';

// Get the React Flow viewport element
function getReactFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport');
}

// Get bounding box of selected nodes
function getSelectedNodesBounds(selectedNodes: Node[]): { x: number; y: number; width: number; height: number } | null {
  if (selectedNodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedNodes.forEach(node => {
    const nodeWidth = (node.style?.width as number) || (node.measured?.width || 150);
    const nodeHeight = (node.style?.height as number) || (node.measured?.height || 100);

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  const padding = 40;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

// Export selected nodes as SVG
export async function exportSelectedAsSvg(selectedNodes: Node[]): Promise<void> {
  if (selectedNodes.length === 0) {
    throw new Error('No nodes selected');
  }

  const reactFlowContainer = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!reactFlowContainer) {
    throw new Error('React Flow viewport not found');
  }

  const bounds = getSelectedNodesBounds(selectedNodes);
  if (!bounds) {
    throw new Error('Could not calculate bounds');
  }

  // Get the current transform of the viewport
  const transform = window.getComputedStyle(reactFlowContainer).transform;
  
  const dataUrl = await toSvg(reactFlowContainer, {
    backgroundColor: '#ffffff',
    width: bounds.width,
    height: bounds.height,
    style: {
      transform: `translate(${-bounds.x}px, ${-bounds.y}px)`,
    },
  });

  // Download
  const link = document.createElement('a');
  link.download = `architecture-selection-${Date.now()}.svg`;
  link.href = dataUrl;
  link.click();
}

// Export selected nodes as PNG
export async function exportSelectedAsPng(selectedNodes: Node[]): Promise<void> {
  if (selectedNodes.length === 0) {
    throw new Error('No nodes selected');
  }

  const reactFlowContainer = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!reactFlowContainer) {
    throw new Error('React Flow viewport not found');
  }

  const bounds = getSelectedNodesBounds(selectedNodes);
  if (!bounds) {
    throw new Error('Could not calculate bounds');
  }

  const dataUrl = await toPng(reactFlowContainer, {
    backgroundColor: '#ffffff',
    width: bounds.width,
    height: bounds.height,
    pixelRatio: 2,
    style: {
      transform: `translate(${-bounds.x}px, ${-bounds.y}px)`,
    },
  });

  // Download
  const link = document.createElement('a');
  link.download = `architecture-selection-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

// Export as PNG
export async function exportAsPng(): Promise<void> {
  const element = getReactFlowElement();
  if (!element) {
    throw new Error('Diagram element not found');
  }

  // Get the bounds of all nodes
  const reactFlowContainer = document.querySelector('.react-flow');
  if (!reactFlowContainer) {
    throw new Error('React Flow container not found');
  }

  const dataUrl = await toPng(reactFlowContainer as HTMLElement, {
    backgroundColor: '#09090b',
    pixelRatio: 2,
  });

  // Download
  const link = document.createElement('a');
  link.download = `architecture-diagram-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

// Export as SVG
export async function exportAsSvg(): Promise<void> {
  const reactFlowContainer = document.querySelector('.react-flow');
  if (!reactFlowContainer) {
    throw new Error('React Flow container not found');
  }

  const dataUrl = await toSvg(reactFlowContainer as HTMLElement, {
    backgroundColor: '#09090b',
  });

  // Download
  const link = document.createElement('a');
  link.download = `architecture-diagram-${Date.now()}.svg`;
  link.href = dataUrl;
  link.click();
}

// Export as PDF
export async function exportAsPdf(): Promise<void> {
  const reactFlowContainer = document.querySelector('.react-flow');
  if (!reactFlowContainer) {
    throw new Error('React Flow container not found');
  }

  // First convert to PNG
  const dataUrl = await toPng(reactFlowContainer as HTMLElement, {
    backgroundColor: '#09090b',
    pixelRatio: 2,
  });

  // Create PDF (landscape A4)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add title
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(9, 9, 11); // zinc-950
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(228, 228, 231); // zinc-200
  pdf.text('Architecture Diagram', 14, 15);
  
  pdf.setFontSize(10);
  pdf.setTextColor(113, 113, 122); // zinc-500
  pdf.text(`Exported: ${new Date().toLocaleString()}`, 14, 22);

  // Add the diagram image
  const imgWidth = pageWidth - 28;
  const imgHeight = pageHeight - 40;
  pdf.addImage(dataUrl, 'PNG', 14, 30, imgWidth, imgHeight);

  // Download
  pdf.save(`architecture-diagram-${Date.now()}.pdf`);
}

// Export as Markdown
export function exportAsMarkdown(data: DiagramData): void {
  const nodes = data.nodes;
  const edges = data.edges;

  let md = '# Architecture Diagram\n\n';
  md += `> Generated: ${new Date().toLocaleString()}\n\n`;

  // Group nodes by type
  const groups = nodes.filter(n => n.type === 'group');
  const regularNodes = nodes.filter(n => n.type !== 'group');

  // Groups section
  if (groups.length > 0) {
    md += '## Infrastructure Groups\n\n';
    md += '| Group | Type | Description |\n';
    md += '|-------|------|-------------|\n';
    groups.forEach(group => {
      const groupData = group.data as unknown as GroupNodeData;
      const config = GROUP_TYPES_CONFIG[groupData.groupType];
      md += `| ${groupData.label} | ${config?.label || groupData.groupType} | ${groupData.description || '-'} |\n`;
    });
    md += '\n';
  }

  // Components section
  md += '## Components\n\n';
  md += '| Component | Type | Technology | Port | Description |\n';
  md += '|-----------|------|------------|------|-------------|\n';
  
  regularNodes.forEach(node => {
    const nodeData = node.data as unknown as ArchitectureNodeData;
    const config = NODE_TYPES_CONFIG[nodeData.type];
    md += `| ${nodeData.label} | ${config?.label || nodeData.type} | ${nodeData.technology || '-'} | ${nodeData.port || '-'} | ${nodeData.description || '-'} |\n`;
  });

  md += '\n';

  // Connections section
  if (edges.length > 0) {
    md += '## Connections\n\n';
    md += '| Source | Target | Protocol | Method | Description |\n';
    md += '|--------|--------|----------|--------|-------------|\n';
    
    edges.forEach(edge => {
      const edgeData = edge.data as unknown as ArchitectureEdgeData;
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const sourceName = sourceNode ? (sourceNode.data as ArchitectureNodeData).label : edge.source;
      const targetName = targetNode ? (targetNode.data as ArchitectureNodeData).label : edge.target;
      
      md += `| ${sourceName} | ${targetName} | ${edgeData?.protocol || '-'} | ${edgeData?.method || '-'} | ${edgeData?.description || '-'} |\n`;
    });

    md += '\n';
  }

  // Architecture overview (Mermaid diagram)
  md += '## Diagram (Mermaid)\n\n';
  md += '```mermaid\ngraph TD\n';
  
  // Add nodes
  regularNodes.forEach(node => {
    const nodeData = node.data as unknown as ArchitectureNodeData;
    const shape = nodeData.type === 'database' ? '[(Database)]' : 
                  nodeData.type === 'queue' ? '{{Queue}}' :
                  nodeData.type === 'gateway' ? '([Gateway])' : 
                  `[${nodeData.label}]`;
    const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    md += `    ${safeId}${shape}\n`;
  });

  // Add edges
  edges.forEach(edge => {
    const edgeData = edge.data as unknown as ArchitectureEdgeData;
    const safeSource = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTarget = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const label = edgeData?.protocol ? `|${edgeData.protocol}|` : '';
    md += `    ${safeSource} -->${label} ${safeTarget}\n`;
  });

  md += '```\n';

  // Download
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `architecture-diagram-${Date.now()}.md`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Export as JSON
export function exportAsJson(data: DiagramData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `architecture-diagram-${Date.now()}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Generate shareable link (compressed data in URL)
export function generateShareableLink(data: DiagramData): string {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    const encoded = encodeURIComponent(base64);
    
    // Create URL with the compressed data
    const url = new URL(window.location.href);
    url.searchParams.set('diagram', encoded);
    
    return url.toString();
  } catch (error) {
    console.error('Failed to generate shareable link:', error);
    throw new Error('Failed to generate shareable link');
  }
}

// Load diagram from URL parameter
export function loadFromShareableLink(): DiagramData | null {
  try {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('diagram');
    
    if (!encoded) {
      return null;
    }
    
    const base64 = decodeURIComponent(encoded);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const decompressed = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed) as DiagramData;
  } catch (error) {
    console.error('Failed to load diagram from link:', error);
    return null;
  }
}

// Copy shareable link to clipboard
export async function copyShareableLink(data: DiagramData): Promise<void> {
  const link = generateShareableLink(data);
  await navigator.clipboard.writeText(link);
}
