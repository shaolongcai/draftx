import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "draftx-mcp",
    version: "1.0.0",
});

const BRIDGE_URL = "http://127.0.0.1:37212/api/mcp";

// 封装调用本地 Electron 桥接服务的函数
async function callBridge(action: string, payload: any) {
    try {
        const response = await fetch(BRIDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, ...payload }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || "Unknown error from DraftX bridge");
        }

        return data;
    } catch (error: any) {
        // 捕获连接拒绝等错误，通常是因为 DraftX 客户端未启动
        if (error.cause?.code === "ECONNREFUSED") {
            throw new Error("无法连接到 DraftX 客户端，请确保 DraftX 已启动！");
        }
        throw error;
    }
}

// 1. 按照关键词获取草稿（如果不传关键词，获取全部）
server.tool(
    "get_drafts",
    "获取 DraftX 笔记列表（仅元数据：标题/路径/修改时间，正文请按 path 读取对应 .md 文件）。支持关键词全文搜索（含中文），如果不传入关键词则返回所有笔记。",
    {
        query: z.string().optional().describe("搜索关键词，留空获取全部"),
        limit: z.number().optional().describe("最大返回数量，默认 50"),
        createdAfter: z.string().optional().describe("创建时间起点（ISO 时间）"),
        createdBefore: z.string().optional().describe("创建时间终点（ISO 时间）"),
        modifiedAfter: z.string().optional().describe("更新时间起点（ISO 时间）"),
        modifiedBefore: z.string().optional().describe("更新时间终点（ISO 时间）"),
    },
    async ({ query, limit, createdAfter, createdBefore, modifiedAfter, modifiedBefore }) => {

        try {
            console.error('查询草稿', { query, limit, createdAfter, createdBefore, modifiedAfter, modifiedBefore });
            const result = await callBridge("get_drafts", { query, limit, createdAfter, createdBefore, modifiedAfter, modifiedBefore });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result.data, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// 2. 读取单篇笔记完整内容（按 uuid 或 path）
server.tool(
    "get_draft",
    "读取 DraftX 单篇笔记的完整 markdown 正文。uuid 和 path 至少传一个（优先用 uuid，均可从 get_drafts 结果中获取）。",
    {
        uuid: z.string().optional().describe("笔记 UUID"),
        path: z.string().optional().describe("笔记的 .md 文件相对路径"),
    },
    async ({ uuid, path }) => {
        try {
            const result = await callBridge("get_draft", { uuid, path });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result.data, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// 3. 添加/更新草稿（传 uuid 则覆盖更新对应 .md 文件）
server.tool(
    "add_draft",
    "向 DraftX 中添加一条新笔记（content 为 markdown 原文，会保存为 .md 文件）。传入已有笔记的 uuid 则覆盖更新该笔记的内容/标题。",
    {
        title: z.string().describe("笔记的标题"),
        content: z.string().describe("笔记的 markdown 内容"),
        uuid: z.string().optional().describe("已有笔记的 UUID，传入则为更新，否则新建"),
    },
    async ({ title, content, uuid }) => {
        try {
            const result = await callBridge("add_draft", { title, content, uuid });
            return {
                content: [
                    {
                        type: "text",
                        text: `${uuid ? "更新" : "添加"}成功！笔记 UUID: ${result.uuid}，文件: ${result.path || "(空内容未创建)"}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `${uuid ? "更新" : "添加"}失败: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// 4. 删除草稿（按 uuid，删除 .md 文件及索引）
server.tool(
    "delete_draft",
    "删除 DraftX 中的一条笔记（按 UUID，会同时删除对应 .md 文件）。",
    {
        uuid: z.string().describe("要删除的笔记 UUID"),
    },
    async ({ uuid }) => {
        try {
            await callBridge("delete_draft", { uuid });
            return {
                content: [
                    {
                        type: "text",
                        text: `删除成功！笔记 UUID: ${uuid}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `删除失败: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// 启动 MCP 协议标准输入输出传输
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("DraftX MCP Server is running via stdio");
}

main().catch(console.error);
