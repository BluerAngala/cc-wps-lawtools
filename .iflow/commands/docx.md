---
name: docx
description: 专业的Word文档处理工具，支持文档创建、编辑、跟踪更改和格式转换
license: Proprietary. LICENSE.txt has complete terms
workflow_trigger: /docx
agent_path: .iflow/agents/docx
---

# DOCX Document Processing Workflow

## Skill Capabilities

This skill provides comprehensive document creation, editing, and analysis with support for:

- **Document Creation**: Create new Word documents from scratch using JavaScript/TypeScript
- **Document Editing**: Modify existing documents with tracked changes and comments
- **Tracked Changes (Redlining)**: Professional document review workflow with change tracking
- **Format Preservation**: Maintain document formatting, styles, and structure
- **Text Extraction**: Convert documents to markdown and other formats
- **Comment Management**: Add, reply to, and manage document comments
- **OOXML Manipulation**: Direct XML-level document structure editing

**Use Cases:**
1. Creating new professional documents
2. Modifying or editing existing content
3. Working with tracked changes for document review
4. Adding comments and annotations
5. Converting document formats
6. Analyzing document structure and content

---

# Workflow Trigger Mechanism

## Command Activation

When the user invokes the `/docx` command, the system **MUST** execute the following automated workflow:

### 1. Environment Setup

**Set working directory and Python path:**
```bash
cd .iflow/agents/docx
export PYTHONPATH=$(pwd)
```

**All script paths are relative to this agent directory:**
- `python ooxml/scripts/unpack.py` → `.iflow/agents/docx/ooxml/scripts/unpack.py`
- `python scripts/document.py` → Access to Document library
- Reference documents: `docx-js.md`, `ooxml.md`

**⚠️ Important: Output File Path Rules**
- `agent_path` (`.iflow/agents/docx`) is ONLY for tool scripts and reference documents
- **Generated Word files MUST be saved to the user's working directory** (e.g., `~/Desktop/workspace/fix_skills/fix_docx`)
- If user does not specify output path, default to workspace root, NOT agent directory
- Examples:
  - ❌ Wrong: `.iflow/agents/docx/output.docx`
  - ✅ Correct: `output.docx` or `~/Desktop/workspace/fix_skills/fix_docx/output.docx`

### 2. Workflow Decision Logic

**Immediately determine task type and execute appropriate workflow:**

| User Request | Workflow Action | Required Reading |
|-------------|-----------------|------------------|
| Create new document | Execute "Creating a new Word document" workflow | Read `docx-js.md` (full file, ~500 lines) |
| Edit existing document | Execute "Editing an existing Word document" workflow | Read `ooxml.md` (full file, ~600 lines) |
| Tracked changes/review | Execute "Redlining workflow for document review" | Read `ooxml.md` (full file, ~600 lines) |
| Text extraction | Use pandoc for conversion | No additional reading required |
| Analyze structure | Unpack and examine XML | Reference SKILL.md as needed |

### 3. Automatic Dependency Management

**Dependency detection and installation strategy:**

The skill follows a "lazy installation" approach:
1. **Assume dependencies are installed** - Execute directly without pre-checks
2. **Install on failure** - Only install if command fails with "command not found" or import error
3. **One-time setup** - Once installed, dependencies persist across sessions

**Installation commands by platform:**

```bash
# macOS (using Homebrew)
brew install pandoc libreoffice poppler

# Python packages
pip install defusedxml

# Node.js packages
npm install -g docx
```

**Linux (apt-based distributions):**
```bash
sudo apt-get install pandoc libreoffice poppler-utils
pip install defusedxml
npm install -g docx
```

### 4. Execution Flow

**Standard execution pattern:**

```
User: /docx [request]
  ↓
System: Parse request type
  ↓
System: cd to agent_path + set PYTHONPATH
  ↓
System: Read appropriate documentation (docx-js.md or ooxml.md)
  ↓
System: Execute workflow steps
  ↓
System: Validate output (if applicable)
  ↓
System: Return result to user
```

### 5. Script Import Pattern

**For Python scripts using the Document library:**

```python
# Import from skill root (PYTHONPATH is already set)
from scripts.document import Document, DocxXMLEditor
from scripts.utilities import XMLEditor

# Initialize with unpacked directory
doc = Document('unpacked_dir', author="iFlow CLI", initials="IC")

# Perform operations
# ...

# Save changes
doc.save()
```

### 6. Critical Execution Rules

1. **ALWAYS read full documentation** - Never use `offset` or `limit` when reading `docx-js.md` or `ooxml.md`
2. **Execute from agent directory** - All relative paths assume agent_path as working directory
3. **Output to workspace root** - Generated Word files MUST be saved to the workspace root (e.g., `~/Desktop/workspace/fix_skills/fix_docx/`) by default, NOT to the agent_path directory. Only save to agent_path if explicitly requested by user or for reference documents
4. **Use PYTHONPATH** - Required for importing Document library modules
5. **Install missing dependencies** - Don't fail due to missing tools, install them automatically
6. **Validate after changes** - Use built-in validators after packing documents

---

# DOCX creation, editing, and analysis

## Overview

A user may ask you to create, edit, or analyze the contents of a .docx file. A .docx file is essentially a ZIP archive containing XML files and other resources that you can read or edit. You have different tools and workflows available for different tasks.

## Workflow Decision Tree

### Reading/Analyzing Content
Use "Text extraction" or "Raw XML access" sections below

### Creating New Document
Use "Creating a new Word document" workflow

### Editing Existing Document
- **Your own document + simple changes**
  Use "Basic OOXML editing" workflow

- **Someone else's document**
  Use **"Redlining workflow"** (recommended default)

- **Legal, academic, business, or government docs**
  Use **"Redlining workflow"** (required)

## Reading and analyzing content

### Text extraction
If you just need to read the text contents of a document, you should convert the document to markdown using pandoc. Pandoc provides excellent support for preserving document structure and can show tracked changes:

```bash
# Convert document to markdown with tracked changes
pandoc --track-changes=all path-to-file.docx -o output.md
# Options: --track-changes=accept/reject/all
```

### Raw XML access
You need raw XML access for: comments, complex formatting, document structure, embedded media, and metadata. For any of these features, you'll need to unpack a document and read its raw XML contents.

#### Unpacking a file
`python ooxml/scripts/unpack.py <office_file> <output_directory>`

#### Key file structures
* `word/document.xml` - Main document contents
* `word/comments.xml` - Comments referenced in document.xml
* `word/media/` - Embedded images and media files
* Tracked changes use `<w:ins>` (insertions) and `<w:del>` (deletions) tags

## Creating a new Word document

When creating a new Word document from scratch, use **docx-js**, which allows you to create Word documents using JavaScript/TypeScript.

### Workflow
1. **MANDATORY - READ ENTIRE FILE**: Read [`docx-js.md`](../agents/docx/docx-js.md) (~500 lines) completely from start to finish. **NEVER set any range limits when reading this file.** Read the full file content for detailed syntax, critical formatting rules, and best practices before proceeding with document creation.
2. Create a JavaScript/TypeScript file using Document, Paragraph, TextRun components (You can assume all dependencies are installed, but if not, refer to the dependencies section below)
3. Export as .docx using Packer.toBuffer()

## Editing an existing Word document

When editing an existing Word document, use the **Document library** (a Python library for OOXML manipulation). The library automatically handles infrastructure setup and provides methods for document manipulation. For complex scenarios, you can access the underlying DOM directly through the library.

### Workflow
1. **MANDATORY - READ ENTIRE FILE**: Read [`ooxml.md`](../agents/docx/ooxml.md) (~600 lines) completely from start to finish. **NEVER set any range limits when reading this file.** Read the full file content for the Document library API and XML patterns for directly editing document files.
2. Unpack the document: `python ooxml/scripts/unpack.py <office_file> <output_directory>`
3. Create and run a Python script using the Document library (see "Document Library" section in ooxml.md)
4. Pack the final document: `python ooxml/scripts/pack.py <input_directory> <office_file>`

The Document library provides both high-level methods for common operations and direct DOM access for complex scenarios.

## Redlining workflow for document review

This workflow allows you to plan comprehensive tracked changes using markdown before implementing them in OOXML. **CRITICAL**: For complete tracked changes, you must implement ALL changes systematically.

**Batching Strategy**: Group related changes into batches of 3-10 changes. This makes debugging manageable while maintaining efficiency. Test each batch before moving to the next.

**Principle: Minimal, Precise Edits**
When implementing tracked changes, only mark text that actually changes. Repeating unchanged text makes edits harder to review and appears unprofessional. Break replacements into: [unchanged text] + [deletion] + [insertion] + [unchanged text]. Preserve the original run's RSID for unchanged text by extracting the `<w:r>` element from the original and reusing it.

Example - Changing "30 days" to "60 days" in a sentence:
```python
# BAD - Replaces entire sentence
'<w:del><w:r><w:delText>The term is 30 days.</w:delText></w:r></w:del><w:ins><w:r><w:t>The term is 60 days.</w:t></w:r></w:ins>'

# GOOD - Only marks what changed, preserves original <w:r> for unchanged text
'<w:r w:rsidR="00AB12CD"><w:t>The term is </w:t></w:r><w:del><w:r><w:delText>30</w:delText></w:r></w:del><w:ins><w:r><w:t>60</w:t></w:r></w:ins><w:r w:rsidR="00AB12CD"><w:t> days.</w:t></w:r>'
```

### Tracked changes workflow

1. **Get markdown representation**: Convert document to markdown with tracked changes preserved:
   ```bash
   pandoc --track-changes=all path-to-file.docx -o current.md
   ```

2. **Identify and group changes**: Review the document and identify ALL changes needed, organizing them into logical batches:

   **Location methods** (for finding changes in XML):
   - Section/heading numbers (e.g., "Section 3.2", "Article IV")
   - Paragraph identifiers if numbered
   - Grep patterns with unique surrounding text
   - Document structure (e.g., "first paragraph", "signature block")
   - **DO NOT use markdown line numbers** - they don't map to XML structure

   **Batch organization** (group 3-10 related changes per batch):
   - By section: "Batch 1: Section 2 amendments", "Batch 2: Section 5 updates"
   - By type: "Batch 1: Date corrections", "Batch 2: Party name changes"
   - By complexity: Start with simple text replacements, then tackle complex structural changes
   - Sequential: "Batch 1: Pages 1-3", "Batch 2: Pages 4-6"

3. **Read documentation and unpack**:
   - **MANDATORY - READ ENTIRE FILE**: Read [`ooxml.md`](../agents/docx/ooxml.md) (~600 lines) completely from start to finish. **NEVER set any range limits when reading this file.** Pay special attention to the "Document Library" and "Tracked Change Patterns" sections.
   - **Unpack the document**: `python ooxml/scripts/unpack.py <file.docx> <dir>`
   - **Note the suggested RSID**: The unpack script will suggest an RSID to use for your tracked changes. Copy this RSID for use in step 4b.

4. **Implement changes in batches**: Group changes logically (by section, by type, or by proximity) and implement them together in a single script. This approach:
   - Makes debugging easier (smaller batch = easier to isolate errors)
   - Allows incremental progress
   - Maintains efficiency (batch size of 3-10 changes works well)

   **Suggested batch groupings:**
   - By document section (e.g., "Section 3 changes", "Definitions", "Termination clause")
   - By change type (e.g., "Date changes", "Party name updates", "Legal term replacements")
   - By proximity (e.g., "Changes on pages 1-3", "Changes in first half of document")

   For each batch of related changes:

   **a. Map text to XML**: Grep for text in `word/document.xml` to verify how text is split across `<w:r>` elements.

   **b. Create and run script**: Use `get_node` to find nodes, implement changes, then `doc.save()`. See **"Document Library"** section in ooxml.md for patterns.

   **Note**: Always grep `word/document.xml` immediately before writing a script to get current line numbers and verify text content. Line numbers change after each script run.

5. **Pack the document**: After all batches are complete, convert the unpacked directory back to .docx:
   ```bash
   python ooxml/scripts/pack.py unpacked reviewed-document.docx
   ```

6. **Final verification**: Do a comprehensive check of the complete document:
   - Convert final document to markdown:
     ```bash
     pandoc --track-changes=all reviewed-document.docx -o verification.md
     ```
   - Verify ALL changes were applied correctly:
     ```bash
     grep "original phrase" verification.md  # Should NOT find it
     grep "replacement phrase" verification.md  # Should find it
     ```
   - Check that no unintended changes were introduced


## Converting Documents to Images

To visually analyze Word documents, convert them to images using a two-step process:

1. **Convert DOCX to PDF**:
   ```bash
   soffice --headless --convert-to pdf document.docx
   ```

2. **Convert PDF pages to JPEG images**:
   ```bash
   pdftoppm -jpeg -r 150 document.pdf page
   ```
   This creates files like `page-1.jpg`, `page-2.jpg`, etc.

Options:
- `-r 150`: Sets resolution to 150 DPI (adjust for quality/size balance)
- `-jpeg`: Output JPEG format (use `-png` for PNG if preferred)
- `-f N`: First page to convert (e.g., `-f 2` starts from page 2)
- `-l N`: Last page to convert (e.g., `-l 5` stops at page 5)
- `page`: Prefix for output files

Example for specific range:
```bash
pdftoppm -jpeg -r 150 -f 2 -l 5 document.pdf page  # Converts only pages 2-5
```

## Code Style Guidelines
**IMPORTANT**: When generating code for DOCX operations:
- Write concise code
- Avoid verbose variable names and redundant operations
- Avoid unnecessary print statements

## Dependencies

Required dependencies (install if not available):

- **pandoc**: `sudo apt-get install pandoc` or `brew install pandoc` (for text extraction)
- **docx**: `npm install -g docx` (for creating new documents)
- **LibreOffice**: `sudo apt-get install libreoffice` or `brew install libreoffice` (for PDF conversion)
- **Poppler**: `sudo apt-get install poppler-utils` or `brew install poppler` (for pdftoppm to convert PDF to images)
- **defusedxml**: `pip install defusedxml` (for secure XML parsing)
