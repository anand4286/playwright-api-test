# 🎯 Auto-Detection Feature - Complete Guide

## 🚀 What's New

Your API Test Generator now supports **automatic OpenAPI specification detection**! You no longer need to specify file paths manually - just drop your OpenAPI specs in the folder and run!

## 🔥 New Commands

### 1. **`auto` Command** - Dedicated Auto-Detection
```bash
# Auto-detect and process ALL OpenAPI specs in current folder
node dist/cli.js auto

# With custom output directory
node dist/cli.js auto -o my-tests

# Open results in browser
node dist/cli.js auto --open
```

### 2. **Enhanced `generate` Command** - Smart Fallback
```bash
# If no --spec provided, automatically detects specs
node dist/cli.js generate

# Still works with specific files
node dist/cli.js generate -s petstore.json
node dist/cli.js generate -s user-api.json
```

## 🎯 How Auto-Detection Works

### **Intelligent File Discovery**
The tool scans the current directory for:
- ✅ `*.json` files
- ✅ `*.yaml` files  
- ✅ `*.yml` files

### **Smart Content Analysis**
Each file is analyzed for OpenAPI indicators:
- ✅ `"openapi": "3.x"` (OpenAPI 3.x)
- ✅ `"swagger": "2.x"` (Swagger 2.x)
- ✅ Required sections: `info` + `paths`
- ❌ Excludes: `package.json`, `tsconfig.json`, etc.

### **Multiple Spec Handling**
- **Single Spec Found**: Processes automatically
- **Multiple Specs Found**: Processes all, creates separate folders
- **No Specs Found**: Shows helpful error with format guidance

## 📁 Output Structure with Auto-Detection

```
generated/
├── petstore/              # ← From petstore.json
│   ├── tests/
│   ├── traceability-matrix.html
│   └── flow-diagrams.html
├── user-api/             # ← From user-api.json
│   ├── tests/
│   ├── traceability-matrix.html
│   └── flow-diagrams.html
└── my-api/               # ← From my-api.yaml
    ├── tests/
    ├── traceability-matrix.html
    └── flow-diagrams.html
```

## 🎯 Use Cases

### **Scenario 1: Single API Project**
```bash
# Just drop your OpenAPI spec and run
cp my-api.json .
node dist/cli.js auto
# ✅ Creates generated/my-api/ with all tests
```

### **Scenario 2: Multi-API Project**
```bash
# Multiple APIs in one project
ls *.json
# petstore.json  user-api.json  payment-api.json

node dist/cli.js auto
# ✅ Creates generated/petstore/, generated/user-api/, generated/payment-api/
```

### **Scenario 3: Team Workflow**
```bash
# Team member joins project
git clone project-repo
cd project-repo
node dist/cli.js auto
# ✅ Automatically processes all APIs, ready to test!
```

## 🔍 Detection Examples

### ✅ **Detected Files**
```
✅ api-spec.json         (contains "openapi": "3.0.1")
✅ swagger.yaml          (contains swagger: "2.0")
✅ petstore.json         (contains paths + info)
✅ user-management.yml   (contains openapi: 3.0.0)
```

### ❌ **Ignored Files**
```
❌ package.json          (contains "scripts", "dependencies")
❌ tsconfig.json         (TypeScript config)
❌ jest.config.js        (Test config)
❌ data.json            (missing openapi/swagger indicators)
```

## 📊 Command Comparison

| Command | When to Use | Output |
|---------|-------------|---------|
| `node dist/cli.js auto` | Process all APIs in folder | Multiple folders |
| `node dist/cli.js generate` | Auto-detect or specific file | Single/Multiple |
| `node dist/cli.js generate -s file.json` | Specific file only | Single folder |

## 🎉 Benefits

### **🚀 Zero Configuration**
- Drop files and run - no setup needed
- Intelligent detection handles file discovery
- Works with any valid OpenAPI/Swagger spec

### **📁 Organized Output**
- Each API gets its own folder
- Clean separation of concerns
- Easy to navigate and review

### **👥 Team Friendly**
- New team members can instantly generate tests
- No need to remember specific file names
- Consistent workflow across projects

### **🔄 Workflow Optimization**
- Fast iteration on multiple APIs
- Batch processing for entire projects
- One command does everything

## 🛠 Advanced Usage

### **Custom Output Location**
```bash
node dist/cli.js auto -o tests/generated
# Creates: tests/generated/petstore/, tests/generated/user-api/
```

### **Skip Tests or Docs**
```bash
node dist/cli.js auto --no-tests    # Only docs
node dist/cli.js auto --no-docs     # Only tests
```

### **Open in Browser**
```bash
node dist/cli.js auto --open
# Automatically opens first spec's documentation
```

## 📝 Quick Reference

```bash
# Most common usage
node dist/cli.js auto                    # Process all APIs
node dist/cli.js generate                # Auto-detect + process
node dist/cli.js generate -s my-api.json # Specific file

# With options
node dist/cli.js auto -o my-output --open # Custom output + browser
```

---

## 🎯 **The Result**

You now have a **truly intelligent** API test generator that:
- 🔍 **Discovers** your OpenAPI specs automatically
- 🚀 **Processes** them without manual intervention  
- 📁 **Organizes** output for easy navigation
- 👥 **Works** for teams out of the box

**Just drop your API specs and run - it's that simple!** ✨
