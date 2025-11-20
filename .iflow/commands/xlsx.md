---
name: xlsx
description: 专业的Excel电子表格处理工具，支持公式计算、数据分析、格式化和可视化
license: Proprietary. LICENSE.txt has complete terms
workflow_trigger: /xlsx
agent_path: .iflow/agents/xlsx
---

# Workflow Trigger Mechanism

## Command Activation

When the user invokes the `/xlsx` command, the system **MUST** execute the following automated workflow:

### 1. Environment Setup

**Set working directory and Python path:**
```bash
cd .iflow/agents/xlsx
export PYTHONPATH=$(pwd)
```

**All script paths are relative to this agent directory:**
- `python recalc.py` → `.iflow/agents/xlsx/recalc.py` (Formula recalculation script)
- Python packages: `openpyxl`, `pandas`
- System dependency: LibreOffice (for formula recalculation)

**⚠️ Important: Output File Path Rules**
- `agent_path` (`.iflow/agents/xlsx`) is ONLY for tool scripts and reference documents
- **Generated Excel files MUST be saved to the user's working directory** (e.g., `~/Desktop/workspace/project_name`)
- If user does not specify output path, default to workspace root, NOT agent directory
- Examples:
  - ❌ Wrong: `.iflow/agents/xlsx/output.xlsx`
  - ✅ Correct: `output.xlsx` or `~/Desktop/workspace/project_name/output.xlsx`

### 2. Workflow Decision Logic

**Immediately determine task type and execute appropriate workflow:**

| User Request | Workflow Action | Best Tool |
|-------------|-----------------|-----------|
| Create new spreadsheet | Use openpyxl with formulas | `openpyxl.Workbook()` |
| Read/analyze data | Use pandas for data operations | `pd.read_excel()` |
| Edit existing file | Use openpyxl preserving formulas | `load_workbook()` |
| Data visualization | Create charts with openpyxl | `openpyxl` + charts |
| Recalculate formulas | Use recalc.py script | `python recalc.py file.xlsx` |
| Financial modeling | Use formulas with color coding | `openpyxl` + standards |

### 3. Automatic Dependency Management

**Dependency detection and installation strategy:**

The skill follows a "lazy installation" approach:
1. **Assume dependencies are installed** - Execute directly without pre-checks
2. **Install on failure** - Only install if command fails with "command not found" or import error
3. **One-time setup** - Once installed, dependencies persist across sessions

**Installation commands by platform:**

```bash
# Python packages (all platforms)
pip install openpyxl pandas

# LibreOffice - macOS (using Homebrew)
brew install --cask libreoffice

# LibreOffice - Linux (apt-based distributions)
sudo apt-get install libreoffice

# LibreOffice - Linux (yum-based distributions)
sudo yum install libreoffice
```

### 4. Execution Flow

**Standard execution pattern:**

```
User: /xlsx [request]
  ↓
System: Parse request type (create/read/edit/analyze)
  ↓
System: cd to agent_path + set PYTHONPATH
  ↓
System: Choose appropriate tool (openpyxl/pandas)
  ↓
System: Execute operations (data/formulas/formatting)
  ↓
System: Save file
  ↓
System: If formulas used → Run recalc.py
  ↓
System: Check for formula errors
  ↓
System: If errors found → Fix and recalculate
  ↓
System: Return result to user
```

### 5. Critical Execution Rules

When executing any part of the XLSX workflow, the system **MUST** adhere to these rules:

1. **ALWAYS use Excel formulas, NOT Python calculations** - Spreadsheets must remain dynamic
   - ❌ Wrong: `sheet['B10'] = sum(values)` (hardcoded result)
   - ✅ Correct: `sheet['B10'] = '=SUM(B2:B9)'` (Excel formula)

2. **Execute from agent directory** - All relative paths assume agent_path as working directory

3. **Output to workspace root** - Generated Excel files MUST be saved to the workspace root (e.g., `~/Desktop/workspace/project_name/`) by default, NOT to the agent_path directory. Only save to agent_path if explicitly requested by user or for reference documents

4. **MANDATORY formula recalculation** - After saving files with formulas:
   ```bash
   python recalc.py output.xlsx
   ```

5. **Zero formula errors requirement** - Check recalc.py output for errors:
   - `#REF!`: Invalid cell references
   - `#DIV/0!`: Division by zero
   - `#VALUE!`: Wrong data type
   - `#NAME?`: Unrecognized formula name

6. **Preserve existing formatting** - When editing files, match existing styles

7. **Use appropriate library**:
   - **openpyxl**: For formulas, formatting, Excel-specific features
   - **pandas**: For data analysis and bulk operations

8. **Financial modeling standards** - Apply color coding:
   - Blue text: User inputs
   - Black text: Formulas
   - Green text: Cross-worksheet references
   - Red text: External links

9. **Verify formula references** - Test 2-3 sample cells before applying broadly

## Skill Capabilities

This skill provides comprehensive Excel spreadsheet toolkit with support for:

- **Spreadsheet Creation**: Create new Excel files with formulas, formatting, and multiple sheets
- **Data Analysis**: Read and analyze data using pandas with statistical operations
- **Formula Management**: Build dynamic formulas with automatic recalculation and error checking
- **Data Visualization**: Create charts and graphs within Excel workbooks
- **File Editing**: Modify existing spreadsheets while preserving formulas and formatting
- **Financial Modeling**: Build financial models with industry-standard color coding and formatting
- **Format Control**: Apply fonts, colors, borders, alignment, and number formatting
- **Multi-sheet Operations**: Work with multiple worksheets and cross-sheet references
- **Formula Verification**: Automatic error detection and reporting (#REF!, #DIV/0!, etc.)
- **Data Import/Export**: Convert between Excel, CSV, TSV, and other formats
- **Large File Support**: Efficient handling of large datasets with read/write optimization

## Overview

**Original Skill Description:** Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When iFlow CLI needs to work with spreadsheets (.xlsx, .xlsm, .csv, .tsv, etc) for: (1) Creating new spreadsheets with formulas and formatting, (2) Reading or analyzing data, (3) Modify existing spreadsheets while preserving formulas, (4) Data analysis and visualization in spreadsheets, or (5) Recalculating formulas.

A user may ask you to create, edit, or analyze the contents of an .xlsx file. You have different tools and workflows available for different tasks.

# Requirements for Outputs

## All Excel files

### Zero Formula Errors
- Every Excel model MUST be delivered with ZERO formula errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?)

### Preserve Existing Templates (when updating templates)
- Study and EXACTLY match existing format, style, and conventions when modifying files
- Never impose standardized formatting on files with established patterns
- Existing template conventions ALWAYS override these guidelines

## Financial models

### Color Coding Standards
Unless otherwise stated by the user or existing template

#### Industry-Standard Color Conventions
- **Blue text (RGB: 0,0,255)**: Hardcoded inputs, and numbers users will change for scenarios
- **Black text (RGB: 0,0,0)**: ALL formulas and calculations
- **Green text (RGB: 0,128,0)**: Links pulling from other worksheets within same workbook
- **Red text (RGB: 255,0,0)**: External links to other files
- **Yellow background (RGB: 255,255,0)**: Key assumptions needing attention or cells that need to be updated

### Number Formatting Standards

#### Required Format Rules
- **Years**: Format as text strings (e.g., "2024" not "2,024")
- **Currency**: Use $#,##0 format; ALWAYS specify units in headers ("Revenue ($mm)")
- **Zeros**: Use number formatting to make all zeros "-", including percentages (e.g., "$#,##0;($#,##0);-")
- **Percentages**: Default to 0.0% format (one decimal)
- **Multiples**: Format as 0.0x for valuation multiples (EV/EBITDA, P/E)
- **Negative numbers**: Use parentheses (123) not minus -123

### Formula Construction Rules

#### Assumptions Placement
- Place ALL assumptions (growth rates, margins, multiples, etc.) in separate assumption cells
- Use cell references instead of hardcoded values in formulas
- Example: Use =B5*(1+$B$6) instead of =B5*1.05

#### Formula Error Prevention
- Verify all cell references are correct
- Check for off-by-one errors in ranges
- Ensure consistent formulas across all projection periods
- Test with edge cases (zero values, negative numbers)
- Verify no unintended circular references

#### Documentation Requirements for Hardcodes
- Comment or in cells beside (if end of table). Format: "Source: [System/Document], [Date], [Specific Reference], [URL if applicable]"
- Examples:
  - "Source: Company 10-K, FY2024, Page 45, Revenue Note, [SEC EDGAR URL]"
  - "Source: Company 10-Q, Q2 2025, Exhibit 99.1, [SEC EDGAR URL]"
  - "Source: Bloomberg Terminal, 8/15/2025, AAPL US Equity"
  - "Source: FactSet, 8/20/2025, Consensus Estimates Screen"

# XLSX creation, editing, and analysis

## Overview

A user may ask you to create, edit, or analyze the contents of an .xlsx file. You have different tools and workflows available for different tasks.

## Important Requirements

**LibreOffice Required for Formula Recalculation**: You can assume LibreOffice is installed for recalculating formula values using the `recalc.py` script. The script automatically configures LibreOffice on first run

## Reading and analyzing data

### Data analysis with pandas
For data analysis, visualization, and basic operations, use **pandas** which provides powerful data manipulation capabilities:

```python
import pandas as pd

# Read Excel
df = pd.read_excel('file.xlsx')  # Default: first sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)  # All sheets as dict

# Analyze
df.head()      # Preview data
df.info()      # Column info
df.describe()  # Statistics

# Write Excel
df.to_excel('output.xlsx', index=False)
```

## Excel File Workflows

## CRITICAL: Use Formulas, Not Hardcoded Values

**Always use Excel formulas instead of calculating values in Python and hardcoding them.** This ensures the spreadsheet remains dynamic and updateable.

### ❌ WRONG - Hardcoding Calculated Values
```python
# Bad: Calculating in Python and hardcoding result
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcodes 5000

# Bad: Computing growth rate in Python
growth = (df.iloc[-1]['Revenue'] - df.iloc[0]['Revenue']) / df.iloc[0]['Revenue']
sheet['C5'] = growth  # Hardcodes 0.15

# Bad: Python calculation for average
avg = sum(values) / len(values)
sheet['D20'] = avg  # Hardcodes 42.5
```

### ✅ CORRECT - Using Excel Formulas
```python
# Good: Let Excel calculate the sum
sheet['B10'] = '=SUM(B2:B9)'

# Good: Growth rate as Excel formula
sheet['C5'] = '=(C4-C2)/C2'

# Good: Average using Excel function
sheet['D20'] = '=AVERAGE(D2:D19)'
```

This applies to ALL calculations - totals, percentages, ratios, differences, etc. The spreadsheet should be able to recalculate when source data changes.

## Common Workflow
1. **Choose tool**: pandas for data, openpyxl for formulas/formatting
2. **Create/Load**: Create new workbook or load existing file
3. **Modify**: Add/edit data, formulas, and formatting
4. **Save**: Write to file
5. **Recalculate formulas (MANDATORY IF USING FORMULAS)**: Use the recalc.py script
   ```bash
   python recalc.py output.xlsx
   ```
6. **Verify and fix any errors**: 
   - The script returns JSON with error details
   - If `status` is `errors_found`, check `error_summary` for specific error types and locations
   - Fix the identified errors and recalculate again
   - Common errors to fix:
     - `#REF!`: Invalid cell references
     - `#DIV/0!`: Division by zero
     - `#VALUE!`: Wrong data type in formula
     - `#NAME?`: Unrecognized formula name

### Creating new Excel files

```python
# Using openpyxl for formulas and formatting
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active

# Add data
sheet['A1'] = 'Hello'
sheet['B1'] = 'World'
sheet.append(['Row', 'of', 'data'])

# Add formula
sheet['B2'] = '=SUM(A1:A10)'

# Formatting
sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet['A1'].alignment = Alignment(horizontal='center')

# Column width
sheet.column_dimensions['A'].width = 20

wb.save('output.xlsx')
```

### Editing existing Excel files

```python
# Using openpyxl to preserve formulas and formatting
from openpyxl import load_workbook

# Load existing file
wb = load_workbook('existing.xlsx')
sheet = wb.active  # or wb['SheetName'] for specific sheet

# Working with multiple sheets
for sheet_name in wb.sheetnames:
    sheet = wb[sheet_name]
    print(f"Sheet: {sheet_name}")

# Modify cells
sheet['A1'] = 'New Value'
sheet.insert_rows(2)  # Insert row at position 2
sheet.delete_cols(3)  # Delete column 3

# Add new sheet
new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

## Recalculating formulas

Excel files created or modified by openpyxl contain formulas as strings but not calculated values. Use the provided `recalc.py` script to recalculate formulas:

```bash
python recalc.py <excel_file> [timeout_seconds]
```

Example:
```bash
python recalc.py output.xlsx 30
```

The script:
- Automatically sets up LibreOffice macro on first run
- Recalculates all formulas in all sheets
- Scans ALL cells for Excel errors (#REF!, #DIV/0!, etc.)
- Returns JSON with detailed error locations and counts
- Works on both Linux and macOS

## Formula Verification Checklist

Quick checks to ensure formulas work correctly:

### Essential Verification
- [ ] **Test 2-3 sample references**: Verify they pull correct values before building full model
- [ ] **Column mapping**: Confirm Excel columns match (e.g., column 64 = BL, not BK)
- [ ] **Row offset**: Remember Excel rows are 1-indexed (DataFrame row 5 = Excel row 6)

### Common Pitfalls
- [ ] **NaN handling**: Check for null values with `pd.notna()`
- [ ] **Far-right columns**: FY data often in columns 50+ 
- [ ] **Multiple matches**: Search all occurrences, not just first
- [ ] **Division by zero**: Check denominators before using `/` in formulas (#DIV/0!)
- [ ] **Wrong references**: Verify all cell references point to intended cells (#REF!)
- [ ] **Cross-sheet references**: Use correct format (Sheet1!A1) for linking sheets

### Formula Testing Strategy
- [ ] **Start small**: Test formulas on 2-3 cells before applying broadly
- [ ] **Verify dependencies**: Check all cells referenced in formulas exist
- [ ] **Test edge cases**: Include zero, negative, and very large values

### Interpreting recalc.py Output
The script returns JSON with error details:
```json
{
  "status": "success",           // or "errors_found"
  "total_errors": 0,              // Total error count
  "total_formulas": 42,           // Number of formulas in file
  "error_summary": {              // Only present if errors found
    "#REF!": {
      "count": 2,
      "locations": ["Sheet1!B5", "Sheet1!C10"]
    }
  }
}
```

## Best Practices

### Library Selection
- **pandas**: Best for data analysis, bulk operations, and simple data export
- **openpyxl**: Best for complex formatting, formulas, and Excel-specific features

### Working with openpyxl
- Cell indices are 1-based (row=1, column=1 refers to cell A1)
- Use `data_only=True` to read calculated values: `load_workbook('file.xlsx', data_only=True)`
- **Warning**: If opened with `data_only=True` and saved, formulas are replaced with values and permanently lost
- For large files: Use `read_only=True` for reading or `write_only=True` for writing
- Formulas are preserved but not evaluated - use recalc.py to update values

### Working with pandas
- Specify data types to avoid inference issues: `pd.read_excel('file.xlsx', dtype={'id': str})`
- For large files, read specific columns: `pd.read_excel('file.xlsx', usecols=['A', 'C', 'E'])`
- Handle dates properly: `pd.read_excel('file.xlsx', parse_dates=['date_column'])`

## Code Style Guidelines
**IMPORTANT**: When generating Python code for Excel operations:
- Write minimal, concise Python code without unnecessary comments
- Avoid verbose variable names and redundant operations
- Avoid unnecessary print statements

**For Excel files themselves**:
- Add comments to cells with complex formulas or important assumptions
- Document data sources for hardcoded values
- Include notes for key calculations and model sections