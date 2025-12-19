import { Box, IconButton, useTheme } from '@mui/material';
import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, NodeKey } from 'lexical';
import { mermaidNode } from '@/nodes/MermaidNode';
import { Edit, Check } from '@mui/icons-material';

interface MermaidComponentProps {
	code: string;
	nodeKey: NodeKey;
}

mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
});

export default function MermaidComponent({ code, nodeKey }: MermaidComponentProps) {
	const [editor] = useLexicalComposerContext();
	const [svg, setSvg] = useState<string>('');
	const [isEditing, setIsEditing] = useState(false);
	const [currentCode, setCurrentCode] = useState(code);
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

	const renderMermaid = async (mermaidCode: string) => {
		try {
			const { svg } = await mermaid.render(id.current, mermaidCode);
			setSvg(svg);
			setError(null);
		} catch (e) {
			console.error('Mermaid render error:', e);
			setError('渲染圖表失敗，請檢查語法');
			// mermaid 在錯誤時會保留一些 DOM，需要清理嗎？通常 render 會覆蓋
		}
	};

	useEffect(() => {
		if (!isEditing) {
			renderMermaid(currentCode);
		}
	}, [currentCode, isEditing]);

	const handleSave = () => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node && node instanceof mermaidNode) {
				node.setCode(currentCode);
			}
		});
		setIsEditing(false);
	};

	return (
		<Box sx={{ position: 'relative', my: 2, border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
			<Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}>
				{isEditing ? (
					<IconButton size="small" onClick={handleSave} color="primary">
						<Check fontSize="small" />
					</IconButton>
				) : (
					<IconButton size="small" onClick={() => setIsEditing(true)}>
						<Edit fontSize="small" />
					</IconButton>
				)}
			</Box>

			{isEditing ? (
				<textarea
					value={currentCode}
					onChange={(e) => setCurrentCode(e.target.value)}
					style={{
						width: '100%',
						minHeight: '150px',
						fontFamily: 'monospace',
						padding: '8px',
						border: '1px solid #ccc',
						borderRadius: '4px',
						resize: 'vertical'
					}}
				/>
			) : (
				<Box
					ref={containerRef}
					dangerouslySetInnerHTML={{ __html: svg }}
					sx={{
						display: 'flex',
						justifyContent: 'center',
						overflowX: 'auto',
						minHeight: '50px'
					}}
				/>
			)}
			{error && <Box sx={{ color: 'error.main', fontSize: '12px', mt: 1 }}>{error}</Box>}
		</Box>
	);
}
