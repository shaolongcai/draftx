import { createServer } from 'http';
import { getDraft, saveStickyNote } from '../database/repositories.js';
import { logger } from '../core/logger.js';
import crypto from 'crypto';

function createLexicalContentJsonFromText(content: string) {
    const lines = content.split(/\r?\n/);
    const children = lines.map((line) => ({
        children: line
            ? [{ detail: 0, format: 0, mode: 'normal', style: '', text: line, type: 'text', version: 1 }]
            : [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: ''
    }));

    return JSON.stringify({
        root: {
            children: children.length ? children : [{ children: [], direction: null, format: '', indent: 0, type: 'paragraph', version: 1, textFormat: 0, textStyle: '' }],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1
        }
    });
}

export function startLocalServer() {
    const server = createServer((req, res) => {
        // 设置跨域和响应头
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'POST' && req.url === '/api/mcp') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    
                    // 1. 搜索/获取草稿能力
                    if (data.action === 'get_drafts') {
                        // 如果 data.query 为空，getDraft 内部会自动返回全部
                        const drafts = getDraft(data.query, data.limit || 50, {
                            createdAfter: data.createdAfter,
                            createdBefore: data.createdBefore,
                            modifiedAfter: data.modifiedAfter,
                            modifiedBefore: data.modifiedBefore
                        });
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, data: drafts }));
                    } 
                    // 2. 添加草稿能力
                    else if (data.action === 'add_draft') {
                        const uuid = crypto.randomUUID();
                        const content = typeof data.content === 'string' ? data.content : '';
                        const contentJson = createLexicalContentJsonFromText(content);
                        saveStickyNote({
                            uuid: uuid,
                            content: content,
                            contentJson: contentJson,
                            title: data.title || '来自 AI 的草稿'
                        } as any);
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, uuid }));
                    } 
                    else {
                        res.writeHead(400);
                        res.end(JSON.stringify({ success: false, error: '未知操作' }));
                    }
                } catch (error: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Not Found' }));
        }
    });

    // 监听本地固定端口，不暴露到外网
    server.listen(37212, '127.0.0.1', () => {
        logger.info('MCP Local Bridge Server running on http://127.0.0.1:37212');
    });
}
