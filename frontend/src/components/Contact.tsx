import React from 'react'
import DiscordIcon from '@/assets/icons/discord.svg'
import { Mail as MailIcon } from 'lucide-react'
import { useNotifications } from '@toolpad/core/useNotifications'

const Contact: React.FC = () => {

    const notifications = useNotifications();

    // 复制邮箱
    const copyEmail = () => {
        navigator.clipboard.writeText('aenou634047622@gmail.com');
        notifications.show('Copied successfully', {
            severity: 'success',
            autoHideDuration: 1800,
        });
    };

    return (
        <div className="flex items-center gap-4 py-2">
            {/* Discord */}
            <button
                type='button'
                onClick={() => window.electronAPI.openExternalUrl('https://discord.gg/TyArpAVf6A')}
                className="cursor-pointer rounded-full transition-transform hover:scale-105"
            >
                <img src={DiscordIcon} className="size-12 rounded-full" />
            </button>
            {/* 邮箱 */}
            <button
                type='button'
                onClick={copyEmail}
                className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-[#3A332C] text-[#F5F4EF] transition-transform hover:scale-105"
            >
                <MailIcon className="size-5" />
            </button>
        </div>
    )
}

export default Contact
