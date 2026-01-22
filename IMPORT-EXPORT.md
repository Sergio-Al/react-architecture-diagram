# Import/Export Feature Documentation

## Overview

The Architecture Flow Designer now supports comprehensive import and export capabilities with validation, multiple formats, and flexible import modes.

## Export Features

### Supported Export Formats

1. **JSON** - Full diagram data with metadata and versioning
2. **PNG** - High-quality raster image (2x pixel ratio)
3. **SVG** - Vector graphics for scalability
4. **PDF** - Printable document with embedded diagram
5. **Markdown** - Structured documentation with tables and Mermaid diagram

### Export Options

When exporting as JSON, you can configure:
- **Include Viewport** - Save current zoom and pan position
- **Include Comments** - Export annotation nodes
- **Include Metadata** - Add version, timestamp, and app info
- **Pretty Print** - Format JSON with indentation

### Versioned Exports

All JSON exports now include:
```json
{
  "version": "1.0.0",
  "exportedAt": "2026-01-21T10:30:00.000Z",
  "metadata": {
    "appName": "Architecture Flow Designer",
    "appVersion": "1.0.0"
  },
  "nodes": [...],
  "edges": [...],
  "viewport": {...}
}
```

## Import Features

### Import Dialog

Access via the toolbar upload button. The dialog provides:
- **Drag & Drop** - Drop files directly onto the dialog
- **File Browser** - Click to browse and select files
- **Auto-Detection** - Automatically detects JSON or Markdown format
- **Live Preview** - See what will be imported before confirming
- **Validation** - Real-time error checking with descriptive messages

### Supported Import Formats

#### 1. JSON Import
- Full diagram data with nodes, edges, and viewport
- Version checking for compatibility
- Schema validation for data integrity

#### 2. Markdown Import
Parses markdown exports with:
- **Component Tables** - Extract nodes from "## Components" section
- **Connection Tables** - Extract edges from "## Connections" section  
- **Mermaid Diagrams** - Parse basic Mermaid flowchart syntax

Example markdown structure:
```markdown
## Components

| Component | Type | Technology | Port | Description |
|-----------|------|------------|------|-------------|
| API Gateway | API Gateway | Kong | 8080 | Main entry point |
| User Service | Microservice | Node.js | 3000 | User management |

## Connections

| Source | Target | Protocol | Method | Description |
|--------|--------|----------|--------|-------------|
| API Gateway | User Service | HTTP | POST | User creation |
```

### Import Modes

#### Replace Mode (Default)
- Completely replaces the current diagram
- Use when starting fresh or loading a saved diagram

#### Merge Mode
- Combines imported diagram with current content
- Creates new IDs for all imported items to avoid conflicts
- Offsets imported nodes to prevent overlap
- Preserves parent-child relationships

#### Append Mode
- Adds imported content to current diagram
- Keeps original IDs (may cause conflicts if duplicates exist)
- Offsets positions but maintains structure

### Validation

The import system validates:
- **Node Structure** - ID, type, position, and required data fields
- **Edge Structure** - Source/target existence and valid connections
- **Protocol Types** - Valid protocol and data format enums
- **Data Contracts** - Schema format validation

Validation produces:
- **Errors** - Critical issues that prevent import (shown in red)
- **Warnings** - Non-critical issues that allow import (shown in amber)

### Error Handling

Comprehensive error messages for:
- Invalid JSON syntax
- Missing required fields
- Invalid node/edge types
- Orphaned edges (source/target nodes don't exist)
- Invalid protocol or data format values

### Toast Notifications

Real-time feedback for:
- ✅ **Success** - Import completed with node/edge counts
- ❌ **Error** - Import failed with reason
- ⚠️ **Warning** - Import succeeded with warnings

## Usage Examples

### Basic Import Workflow

1. Click the upload icon in the toolbar
2. Drag and drop a JSON or Markdown file
3. Review the preview and validation results
4. Select import mode (Replace/Merge/Append)
5. Configure options (viewport, etc.)
6. Click "Import" to apply

### Importing Markdown Exports

The system can re-import its own markdown exports:
1. Export diagram as Markdown
2. Import the markdown file
3. Nodes and edges are reconstructed from tables
4. Positions are auto-calculated in a grid layout

### Merging Multiple Diagrams

1. Have your base diagram open
2. Import another diagram
3. Select "Merge" mode
4. New content appears offset from original
5. Manually rearrange as needed

## Technical Details

### File Structure

**Import Utilities** - `/src/utils/import.ts`
- `validateDiagramData()` - Schema validation
- `parseJSON()` - JSON parsing with validation
- `parseMarkdown()` - Markdown to diagram conversion
- `mergeDiagramData()` - Diagram merging logic
- `appendDiagramData()` - Diagram appending logic
- `importDiagram()` - Main import orchestrator

**Export Utilities** - `/src/utils/export.ts`
- `exportAsJson()` - Enhanced with options and versioning
- `exportAsMarkdown()` - Generates markdown documentation
- Other format exports (PNG, SVG, PDF)

**UI Components**
- `/src/components/ui/ImportDialog.tsx` - Import modal
- `/src/components/ui/Toast.tsx` - Notification system

**State Management**
- `/src/store/uiStore.ts` - Toast notification state

### Type Definitions

```typescript
interface ImportOptions {
  mode: 'replace' | 'merge' | 'append';
  includeViewport: boolean;
  validateSchema: boolean;
}

interface ImportResult {
  success: boolean;
  data?: DiagramData;
  errors?: string[];
  warnings?: string[];
}

interface ExportOptions {
  includeViewport?: boolean;
  includeComments?: boolean;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}
```

## Best Practices

### For Sharing Diagrams
- Use JSON format for full fidelity
- Include metadata for version tracking
- Use Markdown for documentation purposes

### For Backup/Restore
- Export as JSON with viewport included
- Store versioned exports for history
- Use Replace mode when restoring

### For Collaboration
- Export Markdown for reviews and discussions
- Use Merge mode to combine team member contributions
- Include comments for context

### For Documentation
- Export Markdown with Mermaid for wikis
- Include component and connection tables
- Add descriptions for clarity

## Troubleshooting

### Import Fails with "Invalid JSON"
- Check file format is valid JSON
- Verify no syntax errors or missing brackets
- Try opening file in JSON validator

### Import Fails with "No valid nodes found"
- For JSON: Ensure nodes array exists and is not empty
- For Markdown: Check table format matches expected structure
- Verify headers: "## Components" and "## Connections"

### Nodes Overlap After Import
- Use Merge mode instead of Append for better spacing
- Manually adjust positions after import
- Use Auto-layout (Cmd+L) to reorganize

### Some Edges Missing After Import
- Check validation warnings for orphaned edges
- Verify source/target node names match exactly
- Ensure all referenced nodes were imported

## Future Enhancements

Potential improvements:
- Import from Mermaid-only files
- Export to other formats (PlantUML, Draw.io)
- Cloud storage integration
- Collaborative real-time editing
- Import from API documentation (OpenAPI/Swagger)
- Version control with diff visualization
