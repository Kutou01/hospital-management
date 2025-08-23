# Serena Setup for Hospital Management System

## 🚀 Quick Start

### 1. Start Serena MCP Server

**Windows:**

```bash
start-serena.bat
```

**Linux/Mac:**

```bash
./start-serena.sh
```

**Manual:**

```bash
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"
```

### 2. Access Dashboard

- **URL**: http://localhost:24282/dashboard/index.html
- **Port**: 24282 (auto-increments if busy)

## 🔧 Configuration

### Project Configuration (`.serena/project.yml`)

- **Language**: TypeScript
- **Project Name**: hospital-management
- **Initial Prompt**: Comprehensive project overview
- **Ignored Paths**: node_modules, .next, dist, build, logs

### Global Configuration (`.serena/serena_config.yml`)

- **Context**: ide-assistant (optimized for development)
- **Modes**: editing, interactive
- **Dashboard**: Enabled on port 24282
- **Shell Commands**: npm, node, git, docker, etc.

## 📚 Project Memories

Serena has been configured with comprehensive project knowledge:

1. **`project_overview.md`** - Complete system architecture and features
2. **`directory_structure.md`** - Detailed folder organization
3. **`development_commands.md`** - All npm scripts and commands

## 🛠️ Available Tools

### Core Tools

- `find_symbol` - Search for code symbols
- `find_referencing_symbols` - Find symbol references
- `insert_after_symbol` - Add code after symbols
- `replace_symbol_body` - Replace symbol definitions
- `execute_shell_command` - Run terminal commands

### Project Management

- `onboarding` - Project setup and analysis
- `activate_project` - Switch between projects
- `list_memories` - View project knowledge
- `write_memory` - Save new information

### File Operations

- `read_file` - Read file contents
- `create_text_file` - Create new files
- `search_for_pattern` - Find text patterns
- `list_dir` - Browse directories

## 🎯 Usage Examples

### Find a Function

```
"Find the createAppointment function in the appointment service"
```

### Add New Feature

```
"Add a new validation function to the patient service"
```

### Debug Issues

```
"Check why the doctor availability API is failing"
```

### Code Review

```
"Review the authentication middleware for security issues"
```

## 🔍 Context and Modes

### Context: `ide-assistant`

- Optimized for development work
- Full editing capabilities
- Shell command execution enabled
- Best for coding tasks

### Modes

- **`editing`** - Focus on code modification
- **`interactive`** - Conversational development
- **`planning`** - Analysis and planning tasks
- **`one-shot`** - Single response tasks

## 🚨 Troubleshooting

### Common Issues

**Language Server Not Starting**

```bash
# Restart language server
uvx --from git+https://github.com/oraios/serena serena restart_language_server
```

**Project Not Indexed**

```bash
# Re-index project
uvx --from git+https://github.com/oraios/serena serena project index
```

**Dashboard Not Accessible**

- Check if port 24282 is available
- Serena will auto-increment port if busy
- Check firewall settings

**Shell Commands Blocked**

- Verify commands in `allowed_shell_commands` list
- Check project configuration for restrictions

### Performance Tips

1. **Index Large Projects**: Run indexing for better symbol search
2. **Use Specific Queries**: Be precise in your requests
3. **Enable Caching**: Keep language server running
4. **Monitor Dashboard**: Check tool usage statistics

## 🔗 Integration

### Claude Code

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

### Claude Desktop

Add to MCP configuration:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--context",
        "ide-assistant"
      ]
    }
  }
}
```

### VSCode/Cursor

- Install MCP extension
- Configure Serena server
- Use `ide-assistant` context

## 📖 Learn More

- [Serena Documentation](https://github.com/oraios/serena)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Project Architecture](docs/01-system-architecture.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

## 🆘 Support

If you encounter issues:

1. Check the Serena dashboard for logs
2. Review project configuration files
3. Verify language server status
4. Check tool permissions and exclusions

---

**Happy Coding with Serena! 🎉**

