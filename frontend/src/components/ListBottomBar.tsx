import { useEvent } from "@/contexts/EvenContext"
import { useTranslation } from "@/contexts/I18nContext"
import { Add as AddIcon } from "@mui/icons-material"
import { alpha, useTheme } from "@mui/material"
import { useEffect, useRef, useState } from "react"

interface Props {
    /** 当前处在的页面 */
    currentPage: 'draft' | 'list'
    /** 列表条目总数 */
    total: number
    setCurrentPage: (page: 'draft' | 'list') => void
}

/** 自动隐藏延迟（毫秒） */
const AUTO_HIDE_DELAY = 3000

/**
 * 列表页底部栏：进入列表页时先显示，3 秒后渐变隐藏，鼠标 hover 再显示
 */
const ListBottomBar: React.FC<Props> = ({
    currentPage,
    total,
    setCurrentPage,
}) => {
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const { handleOnclickTool$ } = useEvent()
    const { t } = useTranslation()
    const theme = useTheme()

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    // 3 秒后渐变隐藏
    const scheduleHide = () => {
        clearTimer()
        timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_DELAY)
    }

    // 进入列表页时先显示，3 秒后渐变隐藏
    useEffect(() => {
        if (currentPage === 'list') {
            setVisible(true)
            scheduleHide()
        }
        return clearTimer
    }, [currentPage])

    // 新建笔记
    const handleNewNote = () => {
        setCurrentPage('draft')
        handleOnclickTool$.emit('addDraft')
    }

    return (
        // 外层始终占位以接收 hover，内层负责渐变显隐
        <div
            className="absolute bottom-0 left-0 right-0 z-20"
            onMouseEnter={() => {
                clearTimer()
                setVisible(true)
            }}
            onMouseLeave={scheduleHide}
        >
            <div
                className={`flex items-center justify-between px-6 py-3 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                    borderTop: '1px solid #E1E0DA',
                    background: theme.palette.background.default,
                }}
            >
                {/* 新建笔记 */}
                <button
                    onClick={handleNewNote}
                    className="flex items-center gap-1 rounded-full px-4 py-1 transition-colors"
                    style={{
                        border: '1px solid #E1E0DA',
                        color: '#867A6C',
                        background: 'transparent',
                    }}
                >
                    <AddIcon sx={{ fontSize: 18 }} />
                    <span className="text-sm select-none">{t('app.list.newNote')}</span>
                </button>
                {/* 总数 */}
                <span
                    className="text-sm select-none whitespace-nowrap"
                    style={{ color: alpha(theme.palette.text.primary, 0.45) }}
                >
                    {t('app.list.totalItem', { count: total })}
                </span>
            </div>
        </div>
    )
}

export default ListBottomBar
