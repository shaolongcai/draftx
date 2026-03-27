import { app } from 'electron';
import { getDraft } from './dist/database/repositories.js';

app.whenReady().then(() => {
  console.log('Drafts:', getDraft(undefined, 1));
  app.quit();
});