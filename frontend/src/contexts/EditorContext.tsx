/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useRef, MutableRefObject, ReactNode } from 'react';
import type Vditor from 'vditor';

// 共享的 Vditor 编辑器实例引用
interface EditorContextType {
    vditorRef: MutableRefObject<Vditor | null>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * 提供全局唯一的 Vditor 实例引用，Editor 写入，ChatInput / ToolBar 读取
 */
export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const vditorRef = useRef<Vditor | null>(null);
    return (
        <EditorContext.Provider value={{ vditorRef }}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
