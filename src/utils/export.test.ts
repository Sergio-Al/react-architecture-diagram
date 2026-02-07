import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiagramData } from '@/types';

// Mock dependencies before importing the module
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockdata'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;base64,mockdata'),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

// Import after mocking
import {
  exportAsMarkdown,
  exportAsJson,
  generateShareableLink,
  loadFromShareableLink,
} from '@/utils/export';

describe('export utilities', () => {
  let mockLink: { download: string; href: string; click: ReturnType<typeof vi.fn> };
  let createdBlobs: Array<{ content: string; type: string }> = [];
  const originalBlob = global.Blob;

  beforeEach(() => {
    // Track created blobs
    createdBlobs = [];
    
    // Mock Blob constructor
    global.Blob = class MockBlob {
      content: string;
      type: string;
      size: number;
      
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        this.content = parts?.[0]?.toString() || '';
        this.type = options?.type || '';
        this.size = this.content.length;
        createdBlobs.push({ content: this.content, type: this.type });
      }
    } as unknown as typeof Blob;

    // Mock DOM elements and methods
    mockLink = { download: '', href: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000', search: '' },
      writable: true,
      configurable: true,
    });

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    global.Blob = originalBlob;
    vi.restoreAllMocks();
  });

  describe('exportAsMarkdown', () => {
    it('should export diagram data as markdown', () => {
      const data: DiagramData = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'API Service', type: 'service', technology: 'Node.js' } },
          { id: 'node-2', type: 'architecture', position: { x: 200, y: 0 }, data: { label: 'Database', type: 'database', technology: 'PostgreSQL' } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'sql' } },
        ],
      };

      exportAsMarkdown(data);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toContain('architecture-diagram-');
      expect(mockLink.download).toContain('.md');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should include components in markdown table', () => {
      const data: DiagramData = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'API Service', type: 'service', technology: 'Node.js', port: '3000' } },
        ],
        edges: [],
      };

      exportAsMarkdown(data);

      expect(createdBlobs).toHaveLength(1);
      expect(createdBlobs[0].content).toContain('## Components');
      expect(createdBlobs[0].content).toContain('API Service');
      expect(createdBlobs[0].content).toContain('Node.js');
      expect(createdBlobs[0].content).toContain('3000');
      expect(createdBlobs[0].type).toBe('text/markdown');
    });

    it('should include mermaid diagram section', () => {
      const data: DiagramData = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Service A', type: 'service' } },
          { id: 'node-2', type: 'architecture', position: { x: 200, y: 0 }, data: { label: 'Service B', type: 'service' } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'http' } },
        ],
      };

      exportAsMarkdown(data);

      expect(createdBlobs[0].content).toContain('```mermaid');
      expect(createdBlobs[0].content).toContain('graph TD');
    });

    it('should include connections section when edges exist', () => {
      const data: DiagramData = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'API', type: 'service' } },
          { id: 'node-2', type: 'architecture', position: { x: 200, y: 0 }, data: { label: 'DB', type: 'database' } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'sql', description: 'Database connection' } },
        ],
      };

      exportAsMarkdown(data);

      expect(createdBlobs[0].content).toContain('## Connections');
      expect(createdBlobs[0].content).toContain('API');
      expect(createdBlobs[0].content).toContain('DB');
      expect(createdBlobs[0].content).toContain('sql');
    });

    it('should include groups section when groups exist', () => {
      const data = {
        nodes: [
          { id: 'group-1', type: 'group', position: { x: 0, y: 0 }, data: { label: 'VPC', groupType: 'vpc', description: 'Main VPC' } },
          { id: 'node-1', type: 'architecture', position: { x: 50, y: 50 }, data: { label: 'Service', type: 'service' }, parentId: 'group-1' },
        ],
        edges: [],
      } as unknown as DiagramData;

      exportAsMarkdown(data);

      expect(createdBlobs[0].content).toContain('## Infrastructure Groups');
      expect(createdBlobs[0].content).toContain('VPC');
    });
  });

  describe('exportAsJson', () => {
    it('should export diagram data as JSON', () => {
      const data: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      exportAsJson(data);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('.json');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should include version and metadata when includeMetadata is true', () => {
      const data: DiagramData = { nodes: [], edges: [] };

      exportAsJson(data, { includeMetadata: true });

      const parsed = JSON.parse(createdBlobs[0].content);
      expect(parsed.version).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.appName).toBe('Architecture Flow Designer');
    });

    it('should exclude viewport when includeViewport is false', () => {
      const data: DiagramData = {
        nodes: [],
        edges: [],
        viewport: { x: 100, y: 100, zoom: 2 },
      };

      exportAsJson(data, { includeViewport: false });

      const parsed = JSON.parse(createdBlobs[0].content);
      expect(parsed.viewport).toBeUndefined();
    });

    it('should filter out comments when includeComments is false', () => {
      const data = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Service', type: 'service' } },
          { id: 'comment-1', type: 'comment', position: { x: 100, y: 100 }, data: { text: 'A comment' } },
        ],
        edges: [],
      } as unknown as DiagramData;

      exportAsJson(data, { includeComments: false });

      const parsed = JSON.parse(createdBlobs[0].content);
      expect(parsed.nodes).toHaveLength(1);
      expect(parsed.nodes[0].type).toBe('architecture');
    });

    it('should pretty print JSON when prettyPrint is true', () => {
      const data: DiagramData = { nodes: [], edges: [] };

      exportAsJson(data, { prettyPrint: true });

      expect(createdBlobs[0].content).toContain('\n');
      expect(createdBlobs[0].content).toContain('  '); // indentation
    });

    it('should not pretty print JSON when prettyPrint is false', () => {
      const data: DiagramData = { nodes: [], edges: [] };

      exportAsJson(data, { prettyPrint: false, includeMetadata: false });

      expect(createdBlobs[0].content).not.toContain('\n');
    });
  });

  describe('generateShareableLink', () => {
    it('should generate a URL with diagram parameter', () => {
      const data: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const link = generateShareableLink(data);

      expect(link).toContain('diagram=');
      expect(link).toContain('localhost');
    });

    it('should compress diagram data', () => {
      const data: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const link = generateShareableLink(data);
      
      // The encoded data should be present
      const url = new URL(link);
      const diagramParam = url.searchParams.get('diagram');
      expect(diagramParam).toBeTruthy();
      expect(diagramParam!.length).toBeGreaterThan(0);
    });
  });

  describe('loadFromShareableLink', () => {
    it('should return null when no diagram parameter in URL', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000' },
        writable: true,
        configurable: true,
      });

      const result = loadFromShareableLink();
      expect(result).toBeNull();
    });

    it('should return null on invalid data', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000?diagram=invaliddata' },
        writable: true,
        configurable: true,
      });

      const result = loadFromShareableLink();
      expect(result).toBeNull();
    });
  });

  describe('export file naming', () => {
    it('should include timestamp in exported JSON filename', () => {
      const data: DiagramData = { nodes: [], edges: [] };
      
      exportAsJson(data);

      expect(mockLink.download).toMatch(/architecture-diagram-\d+\.json/);
    });

    it('should include timestamp in exported markdown filename', () => {
      const data: DiagramData = { nodes: [], edges: [] };
      
      exportAsMarkdown(data);

      expect(mockLink.download).toMatch(/architecture-diagram-\d+\.md/);
    });
  });
});
