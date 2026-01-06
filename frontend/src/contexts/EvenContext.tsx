import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { useEventEmitter } from 'ahooks';



// 定义上下文接口
interface EventContextType {
    loadStickys$: EventEmitter<StickyResult>
    refreshContent$: EventEmitter<string>
    closePaste$: EventEmitter<void>
}
// 创建上下文
const EventContext = createContext<EventContextType | undefined>(undefined);


/**
 * 订阅事件上下文
 */
export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    //事件
    const loadStickys$ = useEventEmitter<StickyResult>(); //加载便利贴
    const refreshContent$ = useEventEmitter<string>(); //刷新便利贴内容
    const closePaste$ = useEventEmitter<void>(); //关闭粘贴


    return (
        <EventContext.Provider
            value={{
                loadStickys$,
                refreshContent$,
                closePaste$
            }}
        >
            {children}
        </EventContext.Provider>
    );
}

// 自定义Hook，用于访问上下文
export const useEvent = () => {
    const context = useContext(EventContext);
    if (context === undefined) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return context;
};