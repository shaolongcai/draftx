/**
 * 模块解析器 - 用于检测和解析文本中的模块标记
 * 格式: `moduleName 内容直到遇到换行的反引号`
 */

export interface ModuleBlock {
    type: string;           // 模块类型，如 'math', 'paste'
    content: string;        // 模块内容
    startIndex: number;     // 起始位置
    endIndex: number;       // 结束位置
    raw: string;            // 原始文本
}

export interface ParseResult {
    modules: ModuleBlock[]; // 检测到的所有模块
    hasModules: boolean;    // 是否包含模块
}

/**
 * 支持的模块类型
 */
export const SUPPORTED_MODULES = ['math', 'paste', 'code', 'quote'] as const;
export type ModuleType = typeof SUPPORTED_MODULES[number];

/**
 * 模块解析引擎
 * 检测格式: 
 * ```
 * `moduleName
 * 内容...
 * `
 * ```
 * 结束条件: 遇到换行后的反引号 `
 */
export class ModuleParser {
    /**
     * 解析文本中的所有模块
     */
    static parse(text: string): ParseResult {
        const modules: ModuleBlock[] = [];
        
        // 正则表达式：匹配 `moduleName\n内容\n` 格式
        // 匹配规则：
        // 1. 以反引号开始
        // 2. 后跟模块名（支持的模块类型）
        // 3. 换行后是内容
        // 4. 直到遇到换行+反引号结束
        const moduleRegex = /`(math|paste|code|quote)\n([\s\S]*?)\n`/g;
        
        let match: RegExpExecArray | null;
        
        while ((match = moduleRegex.exec(text)) !== null) {
            const [raw, type, content] = match;
            
            modules.push({
                type,
                content: content.trim(),
                startIndex: match.index,
                endIndex: match.index + raw.length,
                raw
            });
        }
        
        return {
            modules,
            hasModules: modules.length > 0
        };
    }
    
    /**
     * 检查文本是否包含特定模块
     */
    static hasModule(text: string, moduleType: ModuleType): boolean {
        const result = this.parse(text);
        return result.modules.some(m => m.type === moduleType);
    }
    
    /**
     * 获取特定类型的所有模块
     */
    static getModulesByType(text: string, moduleType: ModuleType): ModuleBlock[] {
        const result = this.parse(text);
        return result.modules.filter(m => m.type === moduleType);
    }
    
    /**
     * 检查当前输入是否正在编写模块（未完成的模块）
     * 用于实时提示用户
     */
    static isWritingModule(text: string): { isWriting: boolean; moduleType?: string; partialContent?: string } {
        // 匹配未完成的模块：`moduleName\n内容...（没有结束的换行+反引号）
        // 格式：`math\na+b=2（还没输入结束的 \n`）
        const incompleteModuleRegex = /`(math|paste|code|quote)\n((?:(?!\n`).)*?)$/s;
        const match = text.match(incompleteModuleRegex);
        
        if (match) {
            return {
                isWriting: true,
                moduleType: match[1],
                partialContent: match[2].trim()
            };
        }
        
        return { isWriting: false };
    }
    
    /**
     * 验证模块语法是否正确
     */
    static validateModule(moduleBlock: ModuleBlock): { valid: boolean; error?: string } {
        // 检查模块类型是否支持
        if (!SUPPORTED_MODULES.includes(moduleBlock.type as ModuleType)) {
            return {
                valid: false,
                error: `不支持的模块类型: ${moduleBlock.type}`
            };
        }
        
        // 检查内容是否为空
        if (!moduleBlock.content || moduleBlock.content.trim().length === 0) {
            return {
                valid: false,
                error: `模块 ${moduleBlock.type} 的内容不能为空`
            };
        }
        
        return { valid: true };
    }
    
    /**
     * 获取模块统计信息
     */
    static getModuleStats(text: string): Record<string, number> {
        const result = this.parse(text);
        const stats: Record<string, number> = {};
        
        result.modules.forEach(module => {
            stats[module.type] = (stats[module.type] || 0) + 1;
        });
        
        return stats;
    }
}

/**
 * 模块处理器接口
 * 不同的模块类型可以实现不同的处理逻辑
 */
export interface ModuleHandler {
    type: ModuleType;
    process: (content: string) => any;
}

/**
 * 默认的模块处理器
 */
export const defaultHandlers: Record<ModuleType, ModuleHandler> = {
    math: {
        type: 'math',
        process: (content: string) => {
            // Math 模块处理逻辑
            console.log('处理 math 模块:', content);
            return { type: 'math', result: content };
        }
    },
    paste: {
        type: 'paste',
        process: (content: string) => {
            // Paste 模块处理逻辑
            console.log('处理 paste 模块:', content);
            return { type: 'paste', result: content };
        }
    },
    code: {
        type: 'code',
        process: (content: string) => {
            // Code 模块处理逻辑
            console.log('处理 code 模块:', content);
            return { type: 'code', result: content };
        }
    },
    quote: {
        type: 'quote',
        process: (content: string) => {
            // Quote 模块处理逻辑
            console.log('处理 quote 模块:', content);
            return { type: 'quote', result: content };
        }
    }
};
