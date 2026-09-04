/**
 * 历史记录堆栈管理器
 * 用于管理便利贴的浏览历史，支持前进、后退以及新导航截断后续历史的功能。
 * 
 * 行为模型：
 * 1. 正常浏览：A -> B -> C -> D，堆栈为 [A, B, C, D]，指针指向 D
 * 2. 后退：从 D 后退到 B，堆栈保持 [A, B, C, D]，指针指向 B
 * 3. 新导航：在 B 处打开新页面 E，截断 B 之后的记录，堆栈变为 [A, B, E]，指针指向 E
 */

const STORAGE_KEY_STACK = 'sticky_nav_stack';
const STORAGE_KEY_INDEX = 'sticky_nav_index';

class HistoryStack {
    private stack: string[];
    private currentIndex: number;

    constructor() {
        this.stack = this.loadStack();
        this.currentIndex = this.loadIndex();
    }

    /**
     * 从本地存储加载堆栈
     */
    private loadStack(): string[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY_STACK);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load history stack', e);
            return [];
        }
    }

    /**
     * 从本地存储加载当前索引
     */
    private loadIndex(): number {
        try {
            const data = localStorage.getItem(STORAGE_KEY_INDEX);
            return data ? parseInt(data, 10) : -1;
        } catch {
            return -1;
        }
    }

    /**
     * 保存状态到本地存储
     */
    private save() {
        localStorage.setItem(STORAGE_KEY_STACK, JSON.stringify(this.stack));
        localStorage.setItem(STORAGE_KEY_INDEX, this.currentIndex.toString());
    }

    /**
     * 导航到新页面 (Push)
     * 如果当前指针不在栈顶，会丢弃指针之后的所有记录（“前进去哪”变为无）
     * 
     * @param id 页面ID或路由路径
     */
    public push(id: string): void {
        // 如果当前栈为空
        if (this.stack.length === 0) {
            this.stack = [id];
            this.currentIndex = 0;
        } else {
            // 如果当前 ID 与栈顶 ID 相同，通常不重复入栈（可视需求注释掉此判断）
            const currentId = this.stack[this.currentIndex];
            if (currentId === id) {
                return;
            }

            // 核心逻辑：如果当前不在栈顶（曾后退过），需要截断后续历史
            // 例如：[A, B, C, D], Index在 B(1)。Push E -> [A, B, E]
            if (this.currentIndex < this.stack.length - 1) {
                this.stack = this.stack.slice(0, this.currentIndex + 1);
            }
            // 若曾经在栈内，先移除
            const index = this.stack.indexOf(id);
            if (index !== -1) {
                this.stack.splice(index, 1);
            }
            this.stack.push(id);
            this.currentIndex = this.stack.length - 1;
        }
        this.save();
    }

    /**
     * 替换当前页面 (Replace)
     * 不增加堆栈长度，直接修改当前记录
     * 
     * @param id 页面ID
     */
    public replace(id: string): void {
        if (this.stack.length === 0) {
            this.push(id);
            return;
        }
        this.stack[this.currentIndex] = id;
        this.save();
    }

    /**
     * 后退 (Back)
     * @returns 后退后的页面ID，如果无法后退返回 null
     */
    public back(): string | null {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.save();
            return this.stack[this.currentIndex];
        }
        return null;
    }

    /**
     * 前进 (Forward)
     * @returns 前进后的页面ID，如果无法前进返回 null
     */
    public forward(): string | null {
        if (this.currentIndex < this.stack.length - 1) {
            this.currentIndex++;
            this.save();
            return this.stack[this.currentIndex];
        }
        return null;
    }

    /**
     * 获取当前页面ID
     */
    public getCurrent(): string | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.stack.length) {
            return this.stack[this.currentIndex];
        }
        return null;
    }

    /**
     * 是否可以后退
     */
    public canBack(): boolean {
        return this.currentIndex > 0;
    }

    /**
     * 是否可以前进
     */
    public canForward(): boolean {
        return this.currentIndex < this.stack.length - 1;
    }

    /**
     * 从历史堆栈中删除指定的uuid
     */
    public remove(uuid: string): void {
        const index = this.stack.indexOf(uuid);
        if (index !== -1) {
            this.stack.splice(index, 1);
            // 如果删除的是当前页面，需要调整索引
            if (index <= this.currentIndex) {
                this.currentIndex--;
            }
            this.save();
        }
    }

    /**
     * 清空历史记录
     */
    public clear(): void {
        this.stack = [];
        this.currentIndex = -1;
        this.save();
    }

    /**
     * 调试用：获取完整堆栈信息
     */
    public getDebugInfo() {
        return {
            stack: this.stack,
            currentIndex: this.currentIndex,
            current: this.getCurrent()
        };
    }
}

// 导出单例模式
export const historyStack = new HistoryStack();