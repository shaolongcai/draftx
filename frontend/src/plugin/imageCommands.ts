import { createCommand, LexicalCommand } from 'lexical';

import type { ImagePayload } from '../nodes/imageNode/EditorImageNode';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export const OPEN_IMAGE_PICKER_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_IMAGE_PICKER_COMMAND',
);
