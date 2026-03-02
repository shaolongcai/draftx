import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $getNodeByKey,
    $isParagraphNode,
    KEY_ENTER_COMMAND,
    COMMAND_PRIORITY_HIGH,
    $createParagraphNode,
    LexicalNode,
    $isElementNode,
    NodeKey
} from 'lexical';
import axios from 'axios';
import { $createResponseNode, $isResponseNode, ResponseNode } from '@/nodes/ResponseNode';

export function RequestPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const removeEnterListener = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                if (event.defaultPrevented) return false;

                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

                const anchorNode = selection.anchor.getNode();
                let targetNode: LexicalNode | null = anchorNode;
                if ($isTextNode(targetNode)) {
                    targetNode = targetNode.getParent();
                }

                if (!targetNode || !$isParagraphNode(targetNode)) return false;

                const textContent = targetNode.getTextContent().trim();
                const match = textContent.match(/^(get|post):(.+)$/i);

                if (!match) return false;

                event.preventDefault();

                const method = match[1].toLowerCase();
                const url = match[2].trim();

                let body: any = null;
                let token: string | null = null;
                let jsonError: string | null = null;

                if (method === 'post') {
                    let currentSibling = targetNode.getPreviousSibling();
                    let collectedText = '';
                    let maxSteps = 50; 
                    
                    while (currentSibling && maxSteps > 0) {
                        const siblingText = currentSibling.getTextContent().trim();
                        if (siblingText === '') break;
                        collectedText = siblingText + '\n' + collectedText;
                        currentSibling = currentSibling.getPreviousSibling();
                        maxSteps--;
                    }

                    const tokenMatch = collectedText.match(/(?:^|\n)token:(.+)/i);
                    if (tokenMatch) {
                        token = tokenMatch[1].trim();
                    }

                    const firstBrace = collectedText.indexOf('{');
                    const lastBrace = collectedText.lastIndexOf('}');
                    
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                        const jsonString = collectedText.substring(firstBrace, lastBrace + 1);
                        try {
                            body = JSON.parse(jsonString);
                        } catch (e) {
                            jsonError = 'Invalid JSON format';
                        }
                    }
                }

                const config: any = {
                    method: method,
                    url: url.startsWith('http') ? url : `http://${url}`,
                    timeout: 10000,
                };

                if (body) config.data = body;
                if (token) config.headers = { 'Authorization': token };

                editor.update(() => {
                    if (jsonError) {
                        const responseNode = $createResponseNode('error', jsonError, method, url);
                        targetNode!.insertAfter(responseNode);
                        const newParagraph = $createParagraphNode();
                        responseNode.insertAfter(newParagraph);
                        newParagraph.select();
                        return;
                    }

                    const responseNode = $createResponseNode('loading', null, method, url);
                    targetNode!.insertAfter(responseNode);
                    
                    const newParagraph = $createParagraphNode();
                    responseNode.insertAfter(newParagraph);
                    newParagraph.select();

                    // Trigger async request
                    setTimeout(() => {
                        performRequest(editor, responseNode.getKey(), config);
                    }, 0);
                });

                return true;
            },
            COMMAND_PRIORITY_HIGH
        );

        return removeEnterListener;
    }, [editor]);

    return null;
}

const performRequest = async (editor: any, key: NodeKey, config: any) => {
    try {
        const res = await axios(config);
        editor.update(() => {
            const node = $getNodeByKey(key);
            if (node && $isResponseNode(node)) {
                const newNode = $createResponseNode('success', res.data, config.method, config.url);
                node.replace(newNode);
            }
        });
    } catch (err: any) {
        editor.update(() => {
            const node = $getNodeByKey(key);
            if (node && $isResponseNode(node)) {
                const errorMsg = err.response ? 
                    `Status: ${err.response.status} ${err.response.statusText}\n${JSON.stringify(err.response.data, null, 2)}` : 
                    (err.message || 'Unknown Error');
                
                const isTimeout = err.code === 'ECONNABORTED';
                const status = isTimeout ? 'timeout' : 'error';
                
                const newNode = $createResponseNode(status, errorMsg, config.method, config.url);
                node.replace(newNode);
            }
        });
    }
};
