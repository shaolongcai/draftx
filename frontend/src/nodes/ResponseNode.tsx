import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor } from 'lexical';
import { ReactElement, JSXElementConstructor } from 'react';
import { Box, Typography, CircularProgress, Stack } from '@mui/material';

export type RequestStatus = 'loading' | 'success' | 'error' | 'timeout';

export class ResponseNode extends DecoratorNode<React.ReactElement> {
    __status: RequestStatus;
    __data: any;
    __method: string;
    __url: string;

    static getType(): string {
        return 'response-node';
    }

    static clone(node: ResponseNode): ResponseNode {
        return new ResponseNode(node.__status, node.__data, node.__method, node.__url, node.__key);
    }

    constructor(status: RequestStatus, data: any, method: string, url: string, key?: NodeKey) {
        super(key);
        this.__status = status;
        this.__data = data;
        this.__method = method;
        this.__url = url;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('div');
        element.className = 'response-node';
        return element;
    }

    updateDOM(): boolean {
        return false;
    }

    exportJSON(): any {
        return {
            type: 'response-node',
            version: 1,
            status: this.__status,
            data: this.__data,
            method: this.__method,
            url: this.__url,
        };
    }

    isKeyboardSelectable(): boolean {
        return false;
    }

    static importJSON(serializedNode: any): ResponseNode {
        return $createResponseNode(
            serializedNode.status,
            serializedNode.data,
            serializedNode.method,
            serializedNode.url
        );
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement<unknown, string | JSXElementConstructor<any>> {
        const borderColor = this.__status === 'error' || this.__status === 'timeout' ? '#ff4d4f' : '#e0e0e0';
        const bgColor = '#fffbf0'; // Light beige background like in the image

        return (
            <Box
                sx={{
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: bgColor,
                    fontFamily: 'monospace',
                    marginTop: '8px',
                    marginBottom: '8px',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    position: 'relative'
                }}
            >
                {/* Header: Method and URL */}
                <Typography variant="caption" sx={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                    {this.__method.toUpperCase()}:{this.__url}
                </Typography>

                {/* Content */}
                {this.__status === 'loading' && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">Requesting...</Typography>
                    </Stack>
                )}

                {(this.__status === 'error' || this.__status === 'timeout') && (
                    <Typography variant="body2" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', margin: 0 }}>
                        {this.__status === 'timeout' ? 'Request Timeout' : (typeof this.__data === 'string' ? this.__data : 'Request Failed')}
                    </Typography>
                )}

                {this.__status === 'success' && (
                    <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {typeof this.__data === 'object'
                            ? JSON.stringify(this.__data, null, 2)
                            : String(this.__data)
                        }
                    </pre>
                )}
            </Box>
        );
    }
}

export function $createResponseNode(status: RequestStatus, data: any, method: string, url: string, key?: NodeKey): ResponseNode {
    return new ResponseNode(status, data, method, url, key);
}

export function $isResponseNode(node: LexicalNode | null | undefined): node is ResponseNode {
    return node instanceof ResponseNode;
}
