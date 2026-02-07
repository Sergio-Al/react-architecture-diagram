import { describe, it, expect } from 'vitest';
import {
  validateDiagramData,
  parseJSON,
  mergeDiagramData,
  appendDiagramData,
  parseMarkdown,
  detectFileFormat,
  importDiagram,
  SCHEMA_VERSION,
} from '@/utils/import';
import { DiagramData } from '@/types';

describe('import utilities', () => {
  describe('validateDiagramData', () => {
    it('should return error for null data', () => {
      const errors = validateDiagramData(null);
      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('error');
      expect(errors[0].message).toContain('must be an object');
    });

    it('should return error for non-object data', () => {
      const errors = validateDiagramData('not an object');
      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('error');
    });

    it('should return error when nodes is not an array', () => {
      const errors = validateDiagramData({ nodes: 'not an array', edges: [] });
      expect(errors.some(e => e.field === 'nodes' && e.severity === 'error')).toBe(true);
    });

    it('should return error when edges is not an array', () => {
      const errors = validateDiagramData({ nodes: [], edges: 'not an array' });
      expect(errors.some(e => e.field === 'edges' && e.severity === 'error')).toBe(true);
    });

    it('should validate valid minimal diagram data', () => {
      const errors = validateDiagramData({ nodes: [], edges: [] });
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    describe('node validation', () => {
      it('should return error for node without id', () => {
        const data = {
          nodes: [{ type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('id') && e.severity === 'error')).toBe(true);
      });

      it('should return error for node without type', () => {
        const data = {
          nodes: [{ id: 'node-1', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.message.includes('Node type is required'))).toBe(true);
      });

      it('should return error for node without position', () => {
        const data = {
          nodes: [{ id: 'node-1', type: 'architecture', data: { label: 'Test', type: 'service' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('position'))).toBe(true);
      });

      it('should return error for architecture node with invalid type', () => {
        const data = {
          nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'invalid' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('data.type') && e.severity === 'error')).toBe(true);
      });

      it('should validate architecture node with valid type', () => {
        const data = {
          nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      });

      it('should return error for group node with invalid groupType', () => {
        const data = {
          nodes: [{ id: 'group-1', type: 'group', position: { x: 0, y: 0 }, data: { label: 'Group', groupType: 'invalid' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('groupType'))).toBe(true);
      });

      it('should validate group node with valid groupType', () => {
        const data = {
          nodes: [{ id: 'group-1', type: 'group', position: { x: 0, y: 0 }, data: { label: 'Group', groupType: 'vpc' } }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      });

      it('should return error for comment node without text', () => {
        const data = {
          nodes: [{ id: 'comment-1', type: 'comment', position: { x: 0, y: 0 }, data: {} }],
          edges: [],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('text'))).toBe(true);
      });
    });

    describe('edge validation', () => {
      it('should return error for edge without id', () => {
        const data = {
          nodes: [
            { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } },
            { id: 'node-2', type: 'architecture', position: { x: 100, y: 0 }, data: { label: 'Node 2', type: 'service' } },
          ],
          edges: [{ source: 'node-1', target: 'node-2' }],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.message.includes('Edge ID is required'))).toBe(true);
      });

      it('should return error for edge with non-existent source', () => {
        const data = {
          nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } }],
          edges: [{ id: 'edge-1', source: 'non-existent', target: 'node-1' }],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.message.includes('does not exist'))).toBe(true);
      });

      it('should return error for edge with non-existent target', () => {
        const data = {
          nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } }],
          edges: [{ id: 'edge-1', source: 'node-1', target: 'non-existent' }],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.message.includes('does not exist'))).toBe(true);
      });

      it('should return warning for edge with invalid protocol', () => {
        const data = {
          nodes: [
            { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } },
            { id: 'node-2', type: 'architecture', position: { x: 100, y: 0 }, data: { label: 'Node 2', type: 'service' } },
          ],
          edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'invalid-protocol' } }],
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field.includes('protocol') && e.severity === 'warning')).toBe(true);
      });

      it('should validate edge with valid protocol', () => {
        const data = {
          nodes: [
            { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } },
            { id: 'node-2', type: 'architecture', position: { x: 100, y: 0 }, data: { label: 'Node 2', type: 'service' } },
          ],
          edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'http' } }],
        };
        const errors = validateDiagramData(data);
        expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      });
    });

    describe('viewport validation', () => {
      it('should return warning for viewport with invalid x', () => {
        const data = {
          nodes: [],
          edges: [],
          viewport: { x: 'not a number', y: 0, zoom: 1 },
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field === 'viewport.x' && e.severity === 'warning')).toBe(true);
      });

      it('should return warning for viewport with invalid zoom', () => {
        const data = {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: -1 },
        };
        const errors = validateDiagramData(data);
        expect(errors.some(e => e.field === 'viewport.zoom' && e.severity === 'warning')).toBe(true);
      });

      it('should validate viewport with valid values', () => {
        const data = {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        };
        const errors = validateDiagramData(data);
        expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
      });
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify({
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      });

      const result = parseJSON(json);
      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(1);
    });

    it('should return error for invalid JSON syntax', () => {
      const result = parseJSON('{ invalid json }');
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('JSON parsing failed');
    });

    it('should return errors for invalid diagram data', () => {
      const json = JSON.stringify({ nodes: 'invalid', edges: [] });
      const result = parseJSON(json);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should return warnings for non-critical issues', () => {
      const json = JSON.stringify({
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } },
          { id: 'node-2', type: 'architecture', position: { x: 100, y: 0 }, data: { label: 'Node 2', type: 'service' } },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2', data: { protocol: 'invalid' } }],
      });

      const result = parseJSON(json);
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('mergeDiagramData', () => {
    it('should merge imported nodes with current nodes', () => {
      const current: DiagramData = {
        nodes: [{ id: 'current-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Current', type: 'service' } }],
        edges: [],
      };
      const imported: DiagramData = {
        nodes: [{ id: 'imported-1', type: 'architecture', position: { x: 100, y: 100 }, data: { label: 'Imported', type: 'service' } }],
        edges: [],
      };

      const result = mergeDiagramData(current, imported);
      expect(result.nodes).toHaveLength(2);
    });

    it('should generate new IDs for imported nodes', () => {
      const current: DiagramData = { nodes: [], edges: [] };
      const imported: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const result = mergeDiagramData(current, imported);
      expect(result.nodes[0].id).not.toBe('node-1');
      expect(result.nodes[0].id).toContain('imported-');
    });

    it('should offset imported node positions', () => {
      const current: DiagramData = { nodes: [], edges: [] };
      const imported: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const result = mergeDiagramData(current, imported, { x: 50, y: 50 });
      expect(result.nodes[0].position.x).toBe(50);
      expect(result.nodes[0].position.y).toBe(50);
    });

    it('should update edge source and target to new node IDs', () => {
      const current: DiagramData = { nodes: [], edges: [] };
      const imported: DiagramData = {
        nodes: [
          { id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'service' } },
          { id: 'node-2', type: 'architecture', position: { x: 100, y: 0 }, data: { label: 'Node 2', type: 'service' } },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
      };

      const result = mergeDiagramData(current, imported);
      expect(result.edges[0].source).toContain('imported-');
      expect(result.edges[0].target).toContain('imported-');
    });

    it('should preserve current viewport', () => {
      const current: DiagramData = {
        nodes: [],
        edges: [],
        viewport: { x: 100, y: 100, zoom: 2 },
      };
      const imported: DiagramData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      const result = mergeDiagramData(current, imported);
      expect(result.viewport).toEqual({ x: 100, y: 100, zoom: 2 });
    });
  });

  describe('appendDiagramData', () => {
    it('should append imported nodes to current nodes', () => {
      const current: DiagramData = {
        nodes: [{ id: 'current-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Current', type: 'service' } }],
        edges: [],
      };
      const imported: DiagramData = {
        nodes: [{ id: 'imported-1', type: 'architecture', position: { x: 100, y: 100 }, data: { label: 'Imported', type: 'service' } }],
        edges: [],
      };

      const result = appendDiagramData(current, imported);
      expect(result.nodes).toHaveLength(2);
    });

    it('should keep original IDs in append mode', () => {
      const current: DiagramData = { nodes: [], edges: [] };
      const imported: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const result = appendDiagramData(current, imported);
      expect(result.nodes[0].id).toBe('node-1');
    });

    it('should offset imported node positions', () => {
      const current: DiagramData = { nodes: [], edges: [] };
      const imported: DiagramData = {
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      };

      const result = appendDiagramData(current, imported, { x: 200, y: 200 });
      expect(result.nodes[0].position.x).toBe(200);
      expect(result.nodes[0].position.y).toBe(200);
    });
  });

  describe('detectFileFormat', () => {
    it('should detect valid JSON starting with {', () => {
      const content = '{"nodes": [], "edges": []}';
      expect(detectFileFormat(content)).toBe('json');
    });

    it('should detect valid JSON starting with [', () => {
      const content = '[{"id": 1}]';
      expect(detectFileFormat(content)).toBe('json');
    });

    it('should detect invalid JSON as unknown', () => {
      const content = '{ invalid json }';
      expect(detectFileFormat(content)).toBe('unknown');
    });

    it('should detect markdown with Architecture Diagram header', () => {
      const content = '# Architecture Diagram\n\n## Components';
      expect(detectFileFormat(content)).toBe('markdown');
    });

    it('should detect markdown with Nodes and Connections sections', () => {
      const content = '## Nodes\n\n## Connections';
      expect(detectFileFormat(content)).toBe('markdown');
    });

    it('should return unknown for unrecognized content', () => {
      const content = 'just some random text';
      expect(detectFileFormat(content)).toBe('unknown');
    });

    it('should handle content with leading/trailing whitespace', () => {
      const content = '   \n{"nodes": [], "edges": []}\n   ';
      expect(detectFileFormat(content)).toBe('json');
    });
  });

  describe('parseMarkdown', () => {
    it('should parse markdown with components table', () => {
      const markdown = `# Architecture Diagram

## Components

| Component | Type | Technology | Port | Description |
|-----------|------|------------|------|-------------|
| API | Service | Node.js | 3000 | Main API service |
| DB | Database | PostgreSQL | 5432 | Main database |
`;

      const result = parseMarkdown(markdown);
      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(2);
    });

    it('should parse markdown with connections table', () => {
      const markdown = `# Architecture Diagram

## Components

| Component | Type | Technology | Port | Description |
|-----------|------|------------|------|-------------|
| API | Service | Node.js | 3000 | Main API |
| DB | Database | PostgreSQL | 5432 | Database |

## Connections

| Source | Target | Protocol | Method | Description |
|--------|--------|----------|--------|-------------|
| API | DB | SQL | - | Database connection |
`;

      const result = parseMarkdown(markdown);
      expect(result.success).toBe(true);
      expect(result.data?.edges).toHaveLength(1);
    });

    it('should parse mermaid diagrams', () => {
      const markdown = `# Architecture

\`\`\`mermaid
graph TD
    A[API Gateway]
    B[Service]
    A --> B
\`\`\`
`;

      const result = parseMarkdown(markdown);
      expect(result.success).toBe(true);
      expect(result.data?.nodes.length).toBeGreaterThan(0);
    });

    it('should return error when no valid nodes found', () => {
      const markdown = `# Just a Header

Some random content without tables or mermaid.
`;

      const result = parseMarkdown(markdown);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('No valid nodes found');
    });

    it('should map component types correctly', () => {
      const markdown = `## Components

| Component | Type | Technology | Port | Description |
|-----------|------|------------|------|-------------|
| API | API Gateway | Kong | 8000 | Gateway |
| Cache | In-memory Cache | Redis | 6379 | Cache |
`;

      const result = parseMarkdown(markdown);
      expect(result.success).toBe(true);
      const nodes = result.data?.nodes || [];
      expect(nodes.find(n => n.data?.label === 'API')?.data?.type).toBe('gateway');
      expect(nodes.find(n => n.data?.label === 'Cache')?.data?.type).toBe('cache');
    });
  });

  describe('importDiagram', () => {
    it('should auto-detect JSON format and parse', () => {
      const content = JSON.stringify({
        nodes: [{ id: 'node-1', type: 'architecture', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'service' } }],
        edges: [],
      });

      const result = importDiagram(content);
      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(1);
    });

    it('should auto-detect markdown format and parse', () => {
      const content = `# Architecture Diagram

## Components

| Component | Type | Technology | Port | Description |
|-----------|------|------------|------|-------------|
| API | Service | Node.js | 3000 | Main API |
`;

      const result = importDiagram(content);
      expect(result.success).toBe(true);
    });

    it('should return error for unknown format', () => {
      const content = 'random unstructured content';
      const result = importDiagram(content);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Unknown file format');
    });

    it('should remove viewport when includeViewport is false', () => {
      const content = JSON.stringify({
        nodes: [],
        edges: [],
        viewport: { x: 100, y: 100, zoom: 2 },
      });

      const result = importDiagram(content, { includeViewport: false });
      expect(result.success).toBe(true);
      expect(result.data?.viewport).toBeUndefined();
    });
  });

  describe('SCHEMA_VERSION', () => {
    it('should export a valid schema version', () => {
      expect(SCHEMA_VERSION).toBeDefined();
      expect(typeof SCHEMA_VERSION).toBe('string');
      expect(SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/); // semver format
    });
  });
});
