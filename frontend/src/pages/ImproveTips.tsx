import React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ConfigParams } from '@/type/electron';

const ImproveTips: React.FC = () => {

    const navigate = useNavigate();

    const handleConfirm = async () => {
        // 设置为已经显示，下次不再显示
        const p: ConfigParams = {
            key: 'report_agreement',
            value: true,
            type: 'boolean'
        }
        await window.electronAPI.setConfig(p);
        // 关闭当前窗口
        navigate('/');
    };

    return (
        <div className="w-full h-full  flex flex-col items-center select-none">
            {/* Title */}
            <Typography variant="h5" fontWeight={700} className="mb-6  w-full text-left" color='textPrimary'>
                Help Improve DraftX
            </Typography>

            {/* Description */}
            <Typography variant="body1" className="mb-4  leading-7 w-full text-left" color='textSecondary'>
                To keep improving, we anonymously send crash and performance stats—no personal data ever.
            </Typography>

            <Typography variant="body1" className="mb-4  w-full text-left" color='textPrimary'>
                These include:
            </Typography>

            {/* List Items */}
            <Stack spacing={2} className="w-full mb-8">
                <Stack direction="row" spacing={1.5} alignItems="start">
                    <Typography variant="body1" color='textPrimary'>📌</Typography>
                    <Typography variant="body1" className="leading-relaxed" color='textPrimary'>
                        Program exceptions: such as crashes, error codes.
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="start">
                    <Typography variant="body1" color='textPrimary'>📌</Typography>
                    <Typography variant="body1" className="leading-relaxed" color='textPrimary'>
                        Performance data: such as download speed, operation response time, and feature usage frequency (anonymous).
                    </Typography>
                </Stack>
            </Stack>

            {/* Footer Text */}
            <Typography variant="body2" className="mb-8 w-full text-left" color='textSecondary'>
                You can disable this setting at any time in Settings.
            </Typography>

            {/* Button */}
            <Button
                variant="contained"
                onClick={handleConfirm}
                sx={{
                    borderRadius: '8px',
                    padding: '8px 32px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
            >
                I KNOW
            </Button>
        </div>
    );
};

export default ImproveTips;




