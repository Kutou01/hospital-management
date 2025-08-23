#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// MCP Server for Supabase
class SupabaseMCPServer {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      process.exit(1);
    }
    
    console.error(`Connecting to Supabase at: ${this.supabaseUrl}`);

    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    // Send initialization response
    this.sendResponse({
      jsonrpc: '2.0',
      result: {
        name: 'supabase-mcp-server',
        version: '1.0.0',
        capabilities: {
          tools: [
            {
              name: 'query',
              description: 'Execute a SQL query on Supabase',
              inputSchema: {
                type: 'object',
                properties: {
                  sql: {
                    type: 'string',
                    description: 'SQL query to execute'
                  }
                },
                required: ['sql']
              }
            },
            {
              name: 'select',
              description: 'Select data from a table',
              inputSchema: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'Table name'
                  },
                  columns: {
                    type: 'string',
                    description: 'Columns to select (default: *)'
                  },
                  filter: {
                    type: 'object',
                    description: 'Filter conditions'
                  },
                  limit: {
                    type: 'number',
                    description: 'Limit results'
                  }
                },
                required: ['table']
              }
            },
            {
              name: 'insert',
              description: 'Insert data into a table',
              inputSchema: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'Table name'
                  },
                  data: {
                    type: 'object',
                    description: 'Data to insert'
                  }
                },
                required: ['table', 'data']
              }
            },
            {
              name: 'update',
              description: 'Update data in a table',
              inputSchema: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'Table name'
                  },
                  data: {
                    type: 'object',
                    description: 'Data to update'
                  },
                  filter: {
                    type: 'object',
                    description: 'Filter conditions'
                  }
                },
                required: ['table', 'data', 'filter']
              }
            },
            {
              name: 'delete',
              description: 'Delete data from a table',
              inputSchema: {
                type: 'object',
                properties: {
                  table: {
                    type: 'string',
                    description: 'Table name'
                  },
                  filter: {
                    type: 'object',
                    description: 'Filter conditions'
                  }
                },
                required: ['table', 'filter']
              }
            },
            {
              name: 'rpc',
              description: 'Call a Supabase RPC function',
              inputSchema: {
                type: 'object',
                properties: {
                  fn: {
                    type: 'string',
                    description: 'Function name'
                  },
                  params: {
                    type: 'object',
                    description: 'Function parameters'
                  }
                },
                required: ['fn']
              }
            }
          ]
        }
      }
    });

    // Listen for requests
    this.rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line);
        await this.handleRequest(request);
      } catch (error) {
        this.sendError(null, -32700, 'Parse error');
      }
    });
  }

  async handleRequest(request) {
    const { method, params, id } = request;

    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      try {
        let result;
        
        switch (name) {
          case 'query':
            result = await this.executeQuery(args.sql);
            break;
          case 'select':
            result = await this.selectData(args);
            break;
          case 'insert':
            result = await this.insertData(args.table, args.data);
            break;
          case 'update':
            result = await this.updateData(args.table, args.data, args.filter);
            break;
          case 'delete':
            result = await this.deleteData(args.table, args.filter);
            break;
          case 'rpc':
            result = await this.callRpc(args.fn, args.params);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        this.sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          }
        });
      } catch (error) {
        this.sendError(id, -32603, error.message);
      }
    } else {
      this.sendError(id, -32601, 'Method not found');
    }
  }

  async executeQuery(sql) {
    const { data, error } = await this.supabase.rpc('execute_sql', { query: sql });
    if (error) throw error;
    return data;
  }

  async selectData({ table, columns = '*', filter, limit }) {
    let query = this.supabase.from(table).select(columns);
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async insertData(table, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  async updateData(table, data, filter) {
    let query = this.supabase.from(table).update(data);
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  }

  async deleteData(table, filter) {
    let query = this.supabase.from(table).delete();
    
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return { deleted: true, data };
  }

  async callRpc(fn, params = {}) {
    const { data, error } = await this.supabase.rpc(fn, params);
    if (error) throw error;
    return data;
  }

  sendResponse(response) {
    console.log(JSON.stringify(response));
  }

  sendError(id, code, message) {
    this.sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    });
  }
}

// Start the server
const server = new SupabaseMCPServer();
server.start();
