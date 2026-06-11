import { describe, it, expect } from 'vitest';
import { DIAGRAM_TEMPLATES, instantiateTemplate } from './index';
import { validateDiagramData } from '@/utils/import';

describe.each(DIAGRAM_TEMPLATES.map((t) => [t.name, t] as const))('template: %s', (_name, template) => {
  const { nodes, edges, flows } = template.data;

  it('passes the import schema validation', () => {
    expect(validateDiagramData(template.data)).toEqual([]);
  });

  it('lists parent nodes before their children (React Flow requirement)', () => {
    const seen = new Set<string>();
    for (const node of nodes) {
      if (node.parentId) {
        expect(seen, `parent of ${node.id} must come first`).toContain(node.parentId);
      }
      seen.add(node.id);
    }
  });

  it('sets extent and data.parentId consistently on children', () => {
    for (const node of nodes) {
      if (node.parentId) {
        expect(node.extent).toBe('parent');
        expect(node.data.parentId).toBe(node.parentId);
      }
    }
  });

  it('has unique node and edge ids', () => {
    const nodeIds = nodes.map((n) => n.id);
    const edgeIds = edges.map((e) => e.id);
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);
  });

  it('connects edges and flows to existing nodes', () => {
    const ids = new Set(nodes.map((n) => n.id));
    for (const edge of edges) {
      expect(ids).toContain(edge.source);
      expect(ids).toContain(edge.target);
    }
    for (const flow of flows ?? []) {
      expect(ids).toContain(flow.sourceNodeId);
    }
  });

  it('includes at least one playable flow', () => {
    expect(flows?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('instantiateTemplate', () => {
  const template = DIAGRAM_TEMPLATES[0];

  it('remaps every id so two instances never collide', () => {
    const a = instantiateTemplate(template);
    const b = instantiateTemplate(template);
    const aIds = new Set([...a.nodes.map((n) => n.id), ...a.edges.map((e) => e.id)]);
    for (const id of [...b.nodes.map((n) => n.id), ...b.edges.map((e) => e.id)]) {
      expect(aIds).not.toContain(id);
    }
  });

  it('keeps the instance internally consistent after remapping', () => {
    const instance = instantiateTemplate(template);
    const ids = new Set(instance.nodes.map((n) => n.id));
    for (const node of instance.nodes) {
      if (node.parentId) {
        expect(ids).toContain(node.parentId);
        expect(node.data.parentId).toBe(node.parentId);
      }
    }
    for (const edge of instance.edges) {
      expect(ids).toContain(edge.source);
      expect(ids).toContain(edge.target);
    }
    for (const flow of instance.flows ?? []) {
      expect(ids).toContain(flow.sourceNodeId);
    }
  });

  it('does not share mutable state with the template definition', () => {
    const instance = instantiateTemplate(template);
    instance.nodes[0].position.x = -9999;
    expect(template.data.nodes[0].position.x).not.toBe(-9999);
  });
});
